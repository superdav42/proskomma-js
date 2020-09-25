const {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList} = require('graphql');

const docSetType = new GraphQLObjectType({
    name: "DocSet",
    fields: () => ({
        id: {type: GraphQLString}
    })
})



module.exports = docSetType;

