figma.showUI(__html__, { width: 456, height: 952, title: "Variable, Style & Effect Finder" });
figma.ui.postMessage({ type: "editor-info", editorType: figma.editorType });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "get-setting") {
    const value = await figma.clientStorage.getAsync(msg.key);
    figma.ui.postMessage({ type: "setting-value", key: msg.key, value });
    return;
  }

  if (msg.type === "set-setting") {
    await figma.clientStorage.setAsync(msg.key, msg.value);
    return;
  }

  if (msg.type === "search") {
    const mode = msg.mode || "variable";
    const scope = msg.scope || "all-pages";

    // Foundations dev-mode tab sends `queries` (array, multiple variables at once);
    // the standard search sends a single `query` string. Normalize to an array of
    // terms either way so the matching logic only has one path (OR-matched).
    const originalQueries = Array.isArray(msg.queries) ? msg.queries : [msg.query || ""];
    // displayTerms stays index-aligned with `terms` so unmatched terms can be
    // reported back to the UI using the user's original (untransformed) spelling.
    const displayTerms = originalQueries
      .map(t => String(t).trim())
      .filter(t => t.length > 0);
    let terms = displayTerms.map(t => t.toLowerCase());

    if (mode === "variable") {
      // For variables: dots → slashes (hierarchy separator)
      terms = terms.map(t => t.replace(/\./g, "/"));
    }
    // For styles: keep spaces as-is (part of style names like "Drop Shadow")

    const displayQuery = Array.isArray(msg.queries) ? msg.queries.join(", ") : msg.query;
    const ignoreNesting = !!msg.ignoreNesting;

    if (!terms.length) {
      figma.ui.postMessage({ type: "results", data: [], query: "", mode, scope });
      return;
    }

    // Under dynamic-page document access, pages must be explicitly loaded
    // before their contents (children) can be traversed.
    if (scope === "current-page") {
      await figma.currentPage.loadAsync();
    } else {
      await figma.loadAllPagesAsync();
    }

    const pagesToSearch = scope === "current-page"
      ? [figma.currentPage]
      : figma.root.children;

    const { results, matchedTerms } = mode === "style"
      ? await findStyleUsages(terms, pagesToSearch, ignoreNesting)
      : mode === "effect"
      ? await findEffectUsages(terms, pagesToSearch, ignoreNesting)
      : await findVariableUsages(terms, pagesToSearch, ignoreNesting);

    // Map matched lookup terms back to the original (pre-normalized) query
    // strings the user typed, so the UI can report unmatched terms verbatim.
    const unmatchedTerms = displayTerms.filter((_, i) => !matchedTerms.has(terms[i]));

    figma.ui.postMessage({ type: "results", data: results, query: displayQuery, mode, scope, unmatchedTerms });
  }

  if (msg.type === "select-nodes") {
    const nodes = [];
    for (const id of msg.nodeIds) {
      try {
        const node = await figma.getNodeByIdAsync(id);
        if (node) nodes.push(node);
      } catch (e) {
        // Node lookup failed, skip
      }
    }

    if (nodes.length > 0) {
      // Navigate to the page containing the first node
      let targetPage = nodes[0];
      while (targetPage && targetPage.type !== "PAGE") {
        targetPage = targetPage.parent;
      }
      if (targetPage) {
        await figma.setCurrentPageAsync(targetPage);
      }
      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);
    }
  }
};

function getComponentAncestor(node) {
  let n = node;
  while (n) {
    if (n.type === "COMPONENT_SET") return n;
    if (n.type === "COMPONENT" && (!n.parent || n.parent.type === "PAGE")) return n;
    if (!n.parent || n.parent.type === "PAGE") return n;
    n = n.parent;
  }
  return node;
}

function getPageName(node) {
  let n = node;
  while (n && n.type !== "PAGE") n = n.parent;
  return n ? n.name : "—";
}

// "Ignore nesting" support: excludes a hit when the bound node's own name is tagged
// with a bracketed letter-code prefix — e.g. "[Com] Alert", "[Ext Kit] ...". This is
// how a nested instance of a downstream-library component embedded inside another
// component (for documentation/example purposes) is identified. Top-level component
// definitions are also named with this convention, so this must only ever check the
// bound node itself, never walk up to the enclosing component/component-set ancestor
// — checking ancestors would match every top-level definition too and exclude everything.
const BRACKET_PREFIX = /^\[[^\]]+\]/;
function isNestedBracketedInstance(node) {
  return typeof node.name === "string" && BRACKET_PREFIX.test(node.name);
}

// Walks up from a bound node to the nearest variant COMPONENT (one whose parent
// is a COMPONENT_SET) and returns its variant property values, e.g. { Size: "Large",
// State: "Hover" }. Returns null when the node isn't inside a variant set.
function getVariantProperties(node) {
  let n = node;
  while (n) {
    if (n.type === "COMPONENT" && n.parent && n.parent.type === "COMPONENT_SET") {
      try { return n.variantProperties || null; } catch (_) { return null; }
    }
    if (!n.parent || n.parent.type === "PAGE") break;
    n = n.parent;
  }
  return null;
}

function makeEntry(ancestor, page) {
  return {
    componentName: ancestor.name,
    componentType: ancestor.type,
    componentId: ancestor.id,
    page,
    tokens: new Set(),
    nodeIds: new Set(),
    nodeCount: 0,
    nodeDetails: new Map(), // nodeId -> { id, name, variantProperties, tokens: Set }
  };
}

function addNodeDetail(entry, node, tokenName) {
  let detail = entry.nodeDetails.get(node.id);
  if (!detail) {
    detail = { id: node.id, name: node.name, variantProperties: getVariantProperties(node), tokens: new Set() };
    entry.nodeDetails.set(node.id, detail);
  }
  detail.tokens.add(tokenName);
}

function finalizeResults(byComponent) {
  return [...byComponent.values()]
    .map(d => ({
      componentName: d.componentName,
      componentType: d.componentType,
      componentId: d.componentId,
      page: d.page,
      tokens: [...d.tokens].sort(),
      nodeIds: [...d.nodeIds],
      nodeCount: d.nodeCount,
      nodes: [...d.nodeDetails.values()]
        .map(n => ({ id: n.id, name: n.name, variantProperties: n.variantProperties, tokens: [...n.tokens].sort() }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.page.localeCompare(b.page) || a.componentName.localeCompare(b.componentName));
}

async function findVariableUsages(terms, pagesToSearch, ignoreNesting) {
  const byComponent = new Map();
  const matchedTerms = new Set();

  // Step 1 (sync): collect every node's bound-variable references without
  // resolving variable names yet (that requires an async lookup).
  const bindingsList = [];
  function traverse(node) {
    if (node.type === "DOCUMENT" || node.type === "PAGE") {
      if ("children" in node) node.children.forEach(traverse);
      return;
    }
    try {
      const bound = node.boundVariables;
      if (bound && Object.keys(bound).length > 0) {
        for (const [prop, binding] of Object.entries(bound)) {
          const bindings = Array.isArray(binding) ? binding : [binding];
          for (const b of bindings) {
            if (b && b.type === "VARIABLE_ALIAS") {
              bindingsList.push({ node, variableId: b.id });
            }
          }
        }
      }
    } catch (_) {}
    if ("children" in node) node.children.forEach(traverse);
  }

  for (const page of pagesToSearch) traverse(page);

  // Step 2 (async): resolve each unique variable id to its Variable object.
  const uniqueIds = [...new Set(bindingsList.map(b => b.variableId))];
  const idToVariable = new Map();
  for (const id of uniqueIds) {
    try {
      const variable = await figma.variables.getVariableByIdAsync(id);
      if (variable) idToVariable.set(id, variable);
    } catch (e) {
      // Variable lookup failed, skip
    }
  }

  // Step 3: filter by query and group by component.
  for (const { node, variableId } of bindingsList) {
    if (ignoreNesting && isNestedBracketedInstance(node)) continue;
    const variable = idToVariable.get(variableId);
    if (!variable) continue;
    const name = variable.name.toLowerCase();
    const hitTerms = terms.filter(t => name.includes(t));
    if (hitTerms.length) {
      hitTerms.forEach(t => matchedTerms.add(t));
      const ancestor = getComponentAncestor(node);
      const page = getPageName(node);
      const key = `${page}||${ancestor.id}`;

      if (!byComponent.has(key)) byComponent.set(key, makeEntry(ancestor, page));
      const entry = byComponent.get(key);
      entry.tokens.add(variable.name);
      entry.nodeIds.add(node.id);
      addNodeDetail(entry, node, variable.name);
      entry.nodeCount++;
    }
  }

  return { results: finalizeResults(byComponent), matchedTerms };
}

async function findStyleUsages(terms, pagesToSearch, ignoreNesting) {
  const byComponent = new Map();
  const matchedTerms = new Set();
  const normalizeForMatch = (str) => str.toLowerCase().replace(/\s+/g, " ");
  const normalizedTerms = terms.map(normalizeForMatch);
  const styleProps = ["fillStyleId", "strokeStyleId", "textStyleId", "effectStyleId", "gridStyleId"];

  // Step 1 (sync): collect every node+prop that references a style id.
  const usedStyleIds = new Set();
  const nodeStyleList = [];
  function collectStyleIds(node) {
    if (node.type === "DOCUMENT") {
      if ("children" in node) node.children.forEach(collectStyleIds);
      return;
    }
    for (const prop of styleProps) {
      if (prop in node && typeof node[prop] === "string" && node[prop]) {
        usedStyleIds.add(node[prop]);
        nodeStyleList.push({ node, styleId: node[prop] });
      }
    }
    if ("children" in node) node.children.forEach(collectStyleIds);
  }

  for (const page of pagesToSearch) collectStyleIds(page);

  // Step 2 (async): resolve style names and filter by query.
  const matchingIds = new Set();
  const idToStyle = new Map();
  for (const styleId of usedStyleIds) {
    try {
      const style = await figma.getStyleByIdAsync(styleId);
      if (style) {
        idToStyle.set(styleId, style);
        const normalized = normalizeForMatch(style.name);
        normalizedTerms.forEach((t, i) => {
          if (normalized.includes(t) || normalized.replace(/\s/g, "").includes(t.replace(/\s/g, ""))) {
            matchingIds.add(styleId);
            matchedTerms.add(terms[i]);
          }
        });
      }
    } catch (e) {
      // Style lookup failed, skip
    }
  }

  if (!matchingIds.size) return { results: [], matchedTerms };

  // Step 3: group matching nodes by component.
  for (const { node, styleId } of nodeStyleList) {
    if (!matchingIds.has(styleId)) continue;
    if (ignoreNesting && isNestedBracketedInstance(node)) continue;
    const style = idToStyle.get(styleId);
    const ancestor = getComponentAncestor(node);
    const page = getPageName(node);
    const key = `${page}||${ancestor.id}`;

    if (!byComponent.has(key)) byComponent.set(key, makeEntry(ancestor, page));
    const entry = byComponent.get(key);
    if (style) entry.tokens.add(style.name);
    entry.nodeIds.add(node.id);
    entry.nodeCount++;
    if (style) addNodeDetail(entry, node, style.name);
  }

  return { results: finalizeResults(byComponent), matchedTerms };
}

async function findEffectUsages(terms, pagesToSearch, ignoreNesting) {
  const byComponent = new Map();
  const matchedTerms = new Set();
  const normalizeForMatch = (str) => str.toLowerCase().replace(/\s+/g, " ");
  const normalizedTerms = terms.map(normalizeForMatch);

  function serializeEffect(effect) {
    const type = effect.type || "Unknown";
    const parts = [type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace(/_/g, " ")];

    if (effect.blur) parts.push(`${effect.blur.value}px blur`);
    if (effect.offset) parts.push(`offset (${effect.offset.x}, ${effect.offset.y})`);
    if (effect.radius) parts.push(`${effect.radius}px`);
    if (effect.color) {
      const c = effect.color;
      const hex = `#${Math.round(c.r * 255).toString(16).padStart(2, '0')}${Math.round(c.g * 255).toString(16).padStart(2, '0')}${Math.round(c.b * 255).toString(16).padStart(2, '0')}`.toUpperCase();
      parts.push(hex);
    }

    return parts.join(" • ");
  }

  // Step 1 (sync): collect effect-style references and raw applied effects.
  const usedEffectStyleIds = new Set();
  const nodeEffectStyleList = [];
  const nodeRawEffectList = [];
  function collectEffects(node) {
    if (node.type === "DOCUMENT") {
      if ("children" in node) node.children.forEach(collectEffects);
      return;
    }
    if ("effectStyleId" in node && typeof node.effectStyleId === "string" && node.effectStyleId) {
      usedEffectStyleIds.add(node.effectStyleId);
      nodeEffectStyleList.push({ node, styleId: node.effectStyleId });
    }
    if ("effects" in node && node.effects && node.effects.length > 0) {
      for (const effect of node.effects) {
        nodeRawEffectList.push({ node, effect });
      }
    }
    if ("children" in node) node.children.forEach(collectEffects);
  }

  for (const page of pagesToSearch) collectEffects(page);

  // Step 2 (async): resolve effect style names and filter by query.
  const matchingEffectStyleIds = new Set();
  const idToStyle = new Map();
  for (const styleId of usedEffectStyleIds) {
    try {
      const style = await figma.getStyleByIdAsync(styleId);
      if (style) {
        idToStyle.set(styleId, style);
        const normalized = normalizeForMatch(style.name);
        normalizedTerms.forEach((t, i) => {
          if (normalized.includes(t) || normalized.replace(/\s/g, "").includes(t.replace(/\s/g, ""))) {
            matchingEffectStyleIds.add(styleId);
            matchedTerms.add(terms[i]);
          }
        });
      }
    } catch (e) {
      // Effect style lookup failed, skip
    }
  }

  // Step 3: group matches by component (named effect styles).
  for (const { node, styleId } of nodeEffectStyleList) {
    if (!matchingEffectStyleIds.has(styleId)) continue;
    if (ignoreNesting && isNestedBracketedInstance(node)) continue;
    const style = idToStyle.get(styleId);
    const ancestor = getComponentAncestor(node);
    const page = getPageName(node);
    const key = `${page}||${ancestor.id}`;

    if (!byComponent.has(key)) byComponent.set(key, makeEntry(ancestor, page));
    const entry = byComponent.get(key);
    if (style) entry.tokens.add(style.name);
    entry.nodeIds.add(node.id);
    entry.nodeCount++;
    if (style) addNodeDetail(entry, node, style.name);
  }

  // Step 4: also match raw (unnamed / non-style) effects by type keyword.
  for (const { node, effect } of nodeRawEffectList) {
    const effectType = effect.type ? effect.type.toLowerCase() : "";
    const effectTypeSpaced = normalizeForMatch(effectType.replace(/_/g, " "));
    const hitIdxs = [];
    normalizedTerms.forEach((t, i) => {
      if (effectType.includes(t.replace(/\s/g, "")) || effectTypeSpaced.includes(t)) hitIdxs.push(i);
    });
    if (!hitIdxs.length) continue;
    if (ignoreNesting && isNestedBracketedInstance(node)) continue;
    hitIdxs.forEach(i => matchedTerms.add(terms[i]));

    const ancestor = getComponentAncestor(node);
    const page = getPageName(node);
    const key = `${page}||${ancestor.id}`;

    if (!byComponent.has(key)) byComponent.set(key, makeEntry(ancestor, page));
    const entry = byComponent.get(key);
    entry.tokens.add(serializeEffect(effect));
    entry.nodeIds.add(node.id);
    entry.nodeCount++;
    addNodeDetail(entry, node, serializeEffect(effect));
  }

  return { results: finalizeResults(byComponent), matchedTerms };
}
