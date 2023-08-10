let express = require("express");
let sqlite3 = require("sqlite3");
let path = require("path");
let { open } = require("sqlite");
let dbPath = path.join(__dirname, "covid19India.db");

let app = express();
app.use(express.json());
let db = null;
let initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
//get /states/
app.get("/states/", async (request, response) => {
  let getState = `
    select * from state`;
  let getStates = await db.all(getState);
  let getter = [];
  for (let item of getStates) {
    let objState = {};
    objState.stateId = item.state_id;
    objState.stateName = item.state_name;
    objState.population = item.population;
    getter.push(objState);
  }
  response.send(getter);
});

//get /states/:stateId/
app.get("/states/:stateId/", async (request, response) => {
  let { stateId } = request.params;
  let getState = `
    select * from state where state_id = ${stateId}`;
  let getStates = await db.get(getState);
  let objState = {};
  objState.stateId = getStates.state_id;
  objState.stateName = getStates.state_name;
  objState.population = getStates.population;

  response.send(objState);
});

//get /districts/:districtId/
app.get("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let getState = `
    select * from district where district_id = ${districtId}`;
  let getStates = await db.get(getState);
  let objState = {};
  objState.districtId = getStates.district_id;
  objState.districtName = getStates.district_name;
  objState.stateId = getStates.state_id;
  objState.cases = getStates.cases;
  objState.cured = getStates.cured;
  objState.active = getStates.active;
  objState.deaths = getStates.deaths;

  response.send(objState);
});

app.post("/districts/", async (request, response) => {
  let districtData = request.body;
  let { districtName, stateId, cases, cured, active, deaths } = districtData;
  let updater = `insert into district(district_name, state_id, cases, cured, active, deaths) values('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths})`;
  let updatedDistrict = db.run(updater);
  response.send("District Successfully Added");
});

app.put("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let districtData = request.body;
  let { districtName, stateId, cases, cured, active, deaths } = districtData;
  let updater = `update district set district_name='${districtName}', state_id=${stateId}, cases=${cases}, cured=${cured}, active=${active}, deaths=${deaths}`;
  let updatedDistrict = db.run(updater);
  response.send("District Details Updated");
});

app.delete("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;

  let deleter = `delete from district where district_id=${districtId}`;
  let updatedDistrict = await db.run(deleter);
  response.send("District Removed");
});

app.get("/districts/:districtId/details/", async (request, response) => {
  let { districtId } = request.params;
  let finder = `
  select state.state_name 
  from state 
  left join district on state.state_id = district.state_id 
  where district.district_id=${districtId}`;
  let stateFinder = await db.get(finder);
  let obj = {};
  obj.stateName = stateFinder.state_name;
  response.send(obj);
});

app.get("/states/:stateId/stats/", async (request, response) => {
  let { stateId } = request.params;
  stateId = parseInt(stateId);
  let staters = `
  select 
  SUM(cases) as totalCases, 
  SUM(cured) as totalCured, 
  SUM(active) as totalActive, 
  SUM(deaths) as totalDeaths 
  from district 
  where state_id=${stateId}`;
  let stats = await db.get(staters);
  console.log(stats, typeof stateId);
  response.send(stats);
});

module.exports = app;
