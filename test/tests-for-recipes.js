const chai = require("chai");
const chaiHttp = require("chai-http");

const { app, runServer, closeServer } = require("../server");

// this lets us use *expect* style syntax in our tests
// so we can do things like `expect(1 + 1).to.equal(2);`
// http://chaijs.com/api/bdd/
const should = chai.should;

// This let's us make HTTP requests
// in our tests.
// see: https://github.com/chaijs/chai-http
chai.use(chaiHttp);

describe("Recipes", function() {
  // Before our tests run, we activate the server. Our `runServer`
  // function returns a promise, and we return the that promise by
  // doing `return runServer`. If we didn't return a promise here,
  // there's a possibility of a race condition where our tests start
  // running before our server has started.
  before(function() {
    return runServer();
  });

  // although we only have one test module at the moment, we'll
  // close our server at the end of these tests. Otherwise,
  // if we add another test module that also has a `before` block
  // that starts our server, it will cause an error because the
  // server would still be running from the previous tests.
  after(function() {
    return closeServer();
  });

  it("should list recipes on GET", function() {
    // for Mocha tests, when we're dealing with asynchronous operations,
    // we must either return a Promise object or else call a `done` callback
    // at the end of the test. The `chai.request(server).get...` call is asynchronous
    // and returns a Promise, so we just return it.
    return chai
      .get("/recipes")
      .then(function(res) {
       res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a("array");

        // because we create three items on app load
        res.body.should.have.length.of.at.least(1);
        // each item should be an object with key/value pairs
        // for `id`, `name` and `checked`.
        const expectedKeys = ["id", "name", "ingredients"];
        res.body.forEach(function(item) {
          item.should.be.a("object");
          item.should.include.keys('id', 'name', 'ingredients');
        });
      });
  });

  // test strategy:
  //  1. make a POST request with data for a new item
  //  2. inspect response object and prove it has right
  //  status code and that the returned object has an `id`
  it("should add a recipe on POST", function() {
    const newRecipe = { name: "tortilla", ingredients: ["cheese", "beans", "salsa"] };
    return chai
      .request(app)
      .post("/recipes")
      .send(newRecipe)
      .then(function(res) {
       res.should.have.status(201);
        res.should.be.json;
        res.body.should.be.a("object");
        res.body.should.include.keys("id", "name", "ingredients");
        res.body.id.should.equal(newRecipe.name);
        res.body.ingredients.should.be.a('array');
        res.body.ingredients.should.include.members(newRecipe.ingredients);
         });
  });


  it("should update items on PUT", function() {
    const updateData = {
      name: "foo",
      ingredients: ["salsa", "cheese"]
    };

    return (
      chai
        .request(app)
        .get("/recipes")
        .then(function(res) {
          updateData.id = res.body[0].id;
         return chai.request(app)
            .put(`/recipes/${updateData.id}`)
            .send(updateData)
        })
        .then(function(res) {
         res.should.have.status(204);
        });
  });

 
  it("should delete items on DELETE", function() {
    return (
      chai.request(app)
     
        .get("/recipes")
        .then(function(res) {
          return chai.request(app).delete(`/recipes/${res.body[0].id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
        })
  });
});

