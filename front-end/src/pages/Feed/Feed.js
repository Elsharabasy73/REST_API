import React, { Component, Fragment } from "react";

import Post from "../../components/Feed/Post/Post";
import Button from "../../components/Button/Button";
import FeedEdit from "../../components/Feed/FeedEdit/FeedEdit";
import Input from "../../components/Form/Input/Input";
import Paginator from "../../components/Paginator/Paginator";
import Loader from "../../components/Loader/Loader";
import ErrorHandler from "../../components/ErrorHandler/ErrorHandler";
import "./Feed.css";

class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: "",
    postPage: 1,
    postsLoading: true,
    editLoading: false,
  };

  componentDidMount() {
    const graphqlQuery = {
      query: `
    {
      getStatus
    }
    `,
    };
    fetch("http://localhost:8080/graphql", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "bearer " + this.props.token,
      },
      method: "POST",
      body: JSON.stringify(graphqlQuery),
    })
      .then((res) => {
        return res.json();
      })
      .then((resData) => {
        console.log("resData", resData);
        if (resData.errors && resData.errors[0].status === 422) {
          throw new Error("Featchig status failed.");
        }
        if (resData.errors) {
          console.log(resData);
          throw new Error("Featchig status failed2.");
        }
        this.setState({ status: resData.data.getStatus });
      })
      .catch(this.catchError);

    this.loadPosts();
    // const socket = openSocket("http://localhost:8080", {
    //   transports: ["websocket"],
    //   autoConnect: false,
    // });
    // socket.connect();
  }

  loadPosts = (direction) => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }
    let page = this.state.postPage;
    if (direction === "next") {
      page++;
      this.setState({ postPage: page });
    }
    if (direction === "previous") {
      page--;
      this.setState({ postPage: page });
    }
    const graphqlQuery = {
      query: `
        {
          posts(page: ${page}) {
            posts {
              _id
              title
              content
              imageUrl
              creator {
                name
              }
              createdAt
            }
            totalPosts
          }
        }
      `,
    };
    // fetch("http://localhost:8080/feed/posts?page=" + page, {
    fetch("http://localhost:8080/graphql", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + this.props.token,
      },
      method: "POST",
      body: JSON.stringify(graphqlQuery),
    })
      .then((res) => {
        return res.json();
      })
      .then((resData) => {
        if (resData.errors) {
          console.log(resData);
          throw new Error("Featchig posts failed2.");
        }
        // resData.data.posts.sort((a, b) => {
        //   return new Date(b.createdAt) - new Date(a.createdAt);
        // });

        this.setState({
          posts: resData.data.posts.posts.map((post) => {
            return {
              ...post,
              imagePath: post.imageUrl,
            };
          }),
          totalPosts: resData.data.posts.totalPosts,
          postsLoading: false,
        });
      })
      .catch(this.catchError);
  };

  statusUpdateHandler = (event) => {
    event.preventDefault();
    const graphqlQuery = {
      query: `mutation{
      updateStatus(status:"${this.state.status}"){
        status
      }
    }`,
    };
    fetch("http://localhost:8080/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + this.props.token,
      },
      body: JSON.stringify(graphqlQuery),
    })
      .then((res) => {
        return res.json();
      })
      .then((resData) => {
        console.log(resData);
        if (resData.errors) {
          throw new Error("Can't update status!");
        }
      })
      .catch(this.catchError);
  };

  newPostHandler = () => {
    this.setState({ isEditing: true });
  };

  startEditPostHandler = (postId) => {
    this.setState((prevState) => {
      const loadedPost = { ...prevState.posts.find((p) => p._id === postId) };

      return {
        isEditing: true,
        editPost: loadedPost,
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null });
  };

  finishEditHandler = (postData) => {
    this.setState({
      editLoading: true,
    });
    // Set up data (with image!)
    let url = "http://localhost:8080/graphql";
    let method = "POST";

    const formData = new FormData();
    formData.append("image", postData.image);
    if (this.state.editPost) {
      formData.append("oldPath", this.state.editPost.imagePath);
    }

    fetch("http://localhost:8080/post-image", {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + this.props.token,
      },
      body: formData,
    })
      .then((res) => res.json())
      .then((fileResData) => {
        const imageUrl = fileResData.filePath;
        let graphqlQuery = {
          query: `
        mutation{
          createPost(
          postInput:{title:"${postData.title}", 
          content:"${postData.content}", 
          imageUrl:"${imageUrl}"})
          {
            _id
            title
            content
            imageUrl
            creator{_id name}
            createdAt
          }
        }`,
        };
        if (this.state.editPost) {
          graphqlQuery = {
            query: `
          mutation{
            updatePost(id:"${this.state.editPost._id}",
            postData:{title:"${postData.title}", 
            content:"${postData.content}", 
            imageUrl:"${imageUrl}"})
            {
              _id
              title
              content
              imageUrl
              creator{_id name}
              createdAt
            }
          }`,
          };
        }
        return fetch(url, {
          method: method,
          body: JSON.stringify(graphqlQuery),
          headers: {
            Authorization: "Bearer " + this.props.token,
            "Content-Type": "application/json",
          },
        });
      })
      .then((res) => {
        return res.json();
      })
      .then((resData) => {
        console.log(resData);
        if (resData.errors) {
          throw new Error("User login failed!");
        }
        let resDataField = "createPost";
        if (this.state.editPost) resDataField = "updatePost";
        const product = resData.data[resDataField];
        const post = {
          _id: product._id,
          title: product.title,
          content: product.content,
          creator: product.creator,
          createdAt: product.createdAt,
          imagePath: product.image,
        };
        this.setState((prevState) => {
          let updatedPosts = [...prevState.posts];
          if (prevState.editPost) {
            const postIndex = prevState.posts.findIndex(
              (p) => p._id === prevState.editPost._id
            );
            updatedPosts[postIndex] = post;
          } else {
            if (prevState.posts.length >= 2) {
              updatedPosts.pop();
            }
            updatedPosts.unshift(post);
          }
          return {
            posts: updatedPosts,
            isEditing: false,
            editPost: null,
            editLoading: false,
          };
        });
      })
      .catch((err) => {
        console.log(err);
        this.setState({
          isEditing: false,
          editPost: null,
          editLoading: false,
          error: err,
        });
      });
  };

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value });
  };

  deletePostHandler = (postId) => {
    this.setState({ postsLoading: true });
    const graphqlQuery = {
      query: `mutation{
      deletePost(id:"${postId}")
    }`,
    };
    fetch("http://localhost:8080/graphql", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + this.props.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graphqlQuery),
    })
      .then((res) => {
        return res.json();
      })
      .then((resData) => {
        console.log(resData);
        if (resData.errors) {
          console.log(resData);
          throw new Error("post deletion failed.");
        }
        this.loadPosts();
      })
      .catch((err) => {
        console.log(err);
        this.setState({ postsLoading: false });
      });
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = (error) => {
    this.setState({ error: error });
  };

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: "center" }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, "previous")}
              onNext={this.loadPosts.bind(this, "next")}
              lastPage={Math.ceil(this.state.totalPosts / 2)}
              currentPage={this.state.postPage}
            >
              {this.state.posts.map((post) => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.name}
                  date={new Date(post.createdAt).toLocaleDateString("en-US")}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                  onDelete={this.deletePostHandler.bind(this, post._id)}
                />
              ))}
            </Paginator>
          )}
        </section>
      </Fragment>
    );
  }
}

export default Feed;
