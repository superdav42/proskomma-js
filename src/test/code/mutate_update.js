const test = require('tape');
const { pkWithDoc } = require('../lib/load');

const testGroup = 'Mutate Update Operations';

const object2Query = obs => '[' + obs.map(ob => `{type: "${ob.type}" subType: "${ob.subType}" payload: "${ob.payload}"}`).join(', ') + ']';

test(
  `Items (${testGroup})`,
  async function (t) {
    try {
      t.plan(14);
      const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
        lang: 'eng',
        abbr: 'ust',
      }, {}, {}, [], [])[0];
      let query = '{docSets { id documents { id mainSequence { id blocks(positions: [0]) { text itemObjects { type subType payload } } } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      const docSet = result.data.docSets[0];
      const document = docSet.documents[0];
      const sequence = document.mainSequence;
      let block = sequence.blocks[0];
      const itemObjects = block.itemObjects;
      t.ok(block.text.includes('country'));
      t.ok(block.text.includes('land'));

      const newItemObjects = itemObjects
        .map(i => (
          {
            type: i.type,
            subType: i.subType,
            payload: i.payload.replace('country', 'land'),
          }
        ));

      query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` itemObjects: ${object2Query(newItemObjects)}) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.updateItems, true);
      query = '{docSets { id documents { id mainSequence { id blocks(positions: [0]) { text } } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      block = result.data.docSets[0].documents[0].mainSequence.blocks[0];
      t.ok(!block.text.includes('country'));
      t.ok(block.text.includes('land'));
      query = `mutation { updateItems(` +
        `docSetId: "1234"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` itemObjects: ${object2Query(itemObjects)}) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors[0].message, 'DocSet \'1234\' not found');
      query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "5678"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` itemObjects: ${object2Query(itemObjects)}) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors[0].message, 'Document \'5678\' not found');
      query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "9012"` +
        ` blockPosition: 0` +
        ` itemObjects: ${object2Query(itemObjects)}) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors[0].message, 'Sequence \'9012\' not found');
      query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 1000` +
        ` itemObjects: ${object2Query(itemObjects)}) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors[0].message, 'Could not find block 1000 (length=42)');
    } catch (err) {
      console.log(err);
    }
  },
);
