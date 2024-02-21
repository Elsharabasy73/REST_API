const { buildSchema } = require("graphql");

module.exports = buildSchema(`
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

    type User {
        _id: ID!
        name: String!
        email: String!
        password: String
        status: String!
        posts: [Post!]!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
        status:String
    }
    type QueryData{
        text:String!
        views:Int!
    }

    type AuthData{
        token: String!
        userId: String! 
    }

    input PostInputdata{
        title: String!
        content: String!
        imageUrl: String!
    }

    type PostData{
        posts: [Post!]!
        totalPosts: Int!
    }

    type RootQuery {
        login(email:String!, password:String!):AuthData
        posts(page: Int):PostData
        post(id:ID!): Post!
        getStatus:String!
    }

    type RootMutation {
        createUser(userInput: UserInputData): User!
        createPost(postInput: PostInputdata): Post!
        updatePost(id:ID!, postData:PostInputdata): Post!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);
