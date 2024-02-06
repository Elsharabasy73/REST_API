const get = document.getElementById("get");

get.addEventListener("click", ()=>{
  console.log("clicked");
  fetch("http://localhost:8080/feed/posts",)
  .then(res => console.log(res.json()))
  .catch(err => console.log(err))
})
const post = document.getElementById("post");

post.addEventListener("click", () => {
  console.log("clicked");
  fetch("http://localhost:8080/feed/post", {
    method: "post",
    body: JSON.stringify({
      title: "post title",
      content: "post body",
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => console.log(data))
    .catch((err) => console.log(err));
});
/* <button id = 'get'>get</button>
<button id="post">post</button> */