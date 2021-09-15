import xre from 'xregexp';

class Tribos {
  constructor() {
    this.currentStepType = null;
    this.stepActions = [
      {
        regex: xre('^#\\{([^}]+)\\}$'),
        inputType: null,
        outputType: 'nodes',
        function: this.doAbsoluteIdStep,
      },
      {
        regex: xre('^root$'),
        inputType: null,
        outputType: 'nodes',
        function: this.doAbsoluteRootStep,
      },
      {
        regex: xre('^nodes$'),
        function: this.doAbsoluteNodesStep,
        inputType: null,
        outputType: 'nodes',
      },
      {
        regex: xre('^children$'),
        inputType: 'nodes',
        outputType: 'nodes',
        function: this.doChildrenStep,
      },
      {
        regex: xre('^parent$'),
        inputType: 'nodes',
        outputType: 'nodes',
        function: this.doParentStep,
      },
      {
        regex: xre('^siblings$'),
        inputType: 'nodes',
        outputType: 'nodes',
        function: this.doSiblingsStep,
      },
      {
        regex: xre('^node$'),
        inputType: 'nodes',
        outputType: 'node',
        function: this.doNodeStep,
      },
    ];
  }

  // Nodes with one of the listed ids
  doAbsoluteIdStep(docSet, allNodes, result, queryStep, matches) {
    const values = matches[1].split(',').map(v => v.trim());
    return { data: allNodes.filter(n => values.includes(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1])) };
  }

  // The root Node
  doAbsoluteRootStep(docSet, allNodes) {
    return { data: [allNodes[0]] };
  }

  // All the nodes
  doAbsoluteNodesStep(docSet, allNodes) {
    return { data: allNodes };
  }

  // Children of the nodes
  doChildrenStep(docSet, allNodes, result) {
    const childNodeIds = new Set([]);

    for (const parentNode of result.data) {
      const children = docSet.unsuccinctifyScopes(parentNode.is)
        .filter(s => s[2].startsWith('tTreeChild'))
        .map(s => s[2].split('/')[2]);

      for (const child of children) {
        childNodeIds.add(child);
      }
    }
    return { data: allNodes.filter(n => childNodeIds.has(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1])) };
  }

  // The parent of each node
  doParentStep(docSet, allNodes, result) {
    const parentNodeIds = new Set([]);

    for (const childNode of result.data) {
      const parentId = docSet.unsuccinctifyScopes(childNode.is)
        .filter(s => s[2].startsWith('tTreeParent'))
        .map(s => s[2].split('/')[1])[0];
      parentNodeIds.add(parentId);
    }
    return { data: allNodes.filter(n => parentNodeIds.has(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1])) };
  }

  // The children of the parent of each node
  // - get parent of starting node
  // - get children of parent node
  doSiblingsStep(docSet, allNodes, result) {
    const parentNodeIds = new Set([]);

    for (const childNode of result.data) {
      const parentId = docSet.unsuccinctifyScopes(childNode.is)
        .filter(s => s[2].startsWith('tTreeParent'))
        .map(s => s[2].split('/')[1])[0];
      parentNodeIds.add(parentId);
    }

    const parentNodes = allNodes.filter(n => parentNodeIds.has(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1]));
    const childNodeIds = new Set([]);

    for (const parentNode of parentNodes) {
      const children = docSet.unsuccinctifyScopes(parentNode.is)
        .filter(s => s[2].startsWith('tTreeChild'))
        .map(s => s[2].split('/')[2]);

      for (const child of children) {
        childNodeIds.add(child);
      }
    }
    return { data: allNodes.filter(n => childNodeIds.has(docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1])) };
  }

  // The node details
  doNodeStep(docSet, allNodes, result) {
    const ret = [];

    for (const node of result.data) {
      const record = {};

      record.id = docSet.unsuccinctifyScopes(node.bs)[0][2].split('/')[1];

      record.parentId = docSet.unsuccinctifyScopes(node.is)
        .filter(s => s[2].startsWith('tTreeParent'))
        .map(s => s[2].split('/')[1])[0];

      const content = {};

      for (const [scopeLabels, items] of docSet.sequenceItemsByScopes([node], ['tTreeContent/'], false)) {
        const key = scopeLabels.filter(s => s.startsWith('tTreeContent'))[0].split('/')[1];
        content[key] = items.filter(i => i[0] === 'token').map(t => t[2]).join('');
      }

      if (Object.keys(content).length > 0) {
        record.content = content;
      }
      ret.push(record);
    }
    return ret;
  }

  doStep(docSet, allNodes, result, queryStep, isAbsolute) {
    for (const stepAction of this.stepActions) {
      const matches = xre.exec(queryStep, stepAction.regex);

      if (matches && stepAction.inputType === this.currentStepType) {
        const ret = stepAction.function(docSet, allNodes, result, queryStep, matches);
        this.currentStepType = stepAction.outputType;
        return ret;
      }
    }
    return { errors: `Unable to match step ${queryStep}` };
  }

  parse1(docSet, allNodes, result, queryArray, isAbsolute) {
    if (queryArray.length > 0) {
      const stepResult = this.doStep(docSet, allNodes, result, queryArray[0], isAbsolute);

      if (result.errors || result.data.length === 0) {
        return result;
      } else {
        return this.parse1(docSet, allNodes, stepResult, queryArray.slice(1));
      }
    } else {
      return result;
    }
  }

  queryArray(qs) {
    const ret = [];

    for (const s of qs.split('/')) {
      ret.push(s);
    }
    return ret;
  }

  parse(docSet, nodes, queryString) {
    const result = this.parse1(
      docSet,
      nodes,
      { data: nodes },
      this.queryArray(queryString),
      true,
    );

    if (result.data) {
      result.data = result.data.map(n => docSet.unsuccinctifyBlock(n, {}));
    }
    return (JSON.stringify(result, null, 2));
  }
}

module.exports = Tribos;
