const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Graft Introduction";

const pk = pkWithDoc("../test_data/usx/not_nfc18_phm.usx", "fra", "hello")[0];

test(
    `Introduction (${testGroup})`,
    async function (t) {
        try {
            t.plan(23);
            const query = '{ documents { sequences { id type blocks { bg { type, sequenceId } bs { label } text } } mainSequence { id } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const sequences = {};
            for (const seq of result.data.documents[0].sequences) {
                sequences[seq.id] = seq;
            }
            const mainSequence = sequences[result.data.documents[0].mainSequence.id];
            t.equal(Object.keys(sequences).length, 7);
            t.equal(mainSequence.blocks[0].bg.length, 3);
            t.equal(mainSequence.blocks[0].bg[0].type, "title");
            t.equal(mainSequence.blocks[0].bg[1].type, "introduction");
            t.equal(mainSequence.blocks[0].bg[2].type, "heading");
            const introSequence = sequences[mainSequence.blocks[0].bg[1].sequenceId];
            t.equal(introSequence.blocks.length, 3);
            t.equal(introSequence.blocks[0].bs.label.split("/")[1], "ip");
            const titleGraft = introSequence.blocks[0].bg[0];
            t.equal(titleGraft.type, "title");
            const titleSequence = sequences[titleGraft.sequenceId];
            t.equal(titleSequence.blocks.length, 3);
            t.equal(titleSequence.blocks[0].bs.label, "blockTag/imt2");
            t.equal(titleSequence.blocks[1].bs.label, "blockTag/imt3");
            t.equal(titleSequence.blocks[2].bs.label, "blockTag/imt");
            t.equal(introSequence.blocks[1].bs.label.split("/")[1], "ip");
            const headingGraft = introSequence.blocks[1].bg[0];
            t.equal(headingGraft.type, "heading");
            const headingSequence = sequences[headingGraft.sequenceId];
            t.equal(headingSequence.blocks.length, 1);
            t.equal(headingSequence.blocks[0].bs.label, "blockTag/is");
            t.equal(introSequence.blocks[2].bs.label.split("/")[1], "ib");
            const endTitleGraft = introSequence.blocks[2].bg[0];
            t.equal(endTitleGraft.type, "endTitle");
            const endTitleSequence = sequences[endTitleGraft.sequenceId];
            t.equal(endTitleSequence.blocks.length, 3);
            t.equal(endTitleSequence.blocks[0].bs.label, "blockTag/imte2");
            t.equal(endTitleSequence.blocks[1].bs.label, "blockTag/imte3");
            t.equal(endTitleSequence.blocks[2].bs.label, "blockTag/imte");
        } catch (err) {
            console.log(err)
        }
    }
);