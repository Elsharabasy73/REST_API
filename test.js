const express = require('express');
const { graphqlHTTP } = require('express-graphql');
 
const app = express();
const MyGraphQLSchema = require('./graphql/schema')
app.use(
  '/graphql',
  graphqlHTTP({
    schema: MyGraphQLSchema,
    graphiql: true,
  }),
);
 
app.listen(4000);
