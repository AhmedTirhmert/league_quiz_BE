/** @format */

const axios = require('axios').create({
  baseURL: 'http://ddragon.leagueoflegends.com/cdn',
});

async function nextChampionName(currentChampion) {
  try {
    let response = await axios.get('11.16.1/data/en_US/champion.json');
    let names = Object.keys(response.data.data).map((key) => {
      return response.data.data[key].name;
    });
    names =  names.sort((a, b) => a - b);
    return names[names.indexOf(currentChampion)+1]
  } catch (error) {
    console.log(error)
  }
}
async function loadChampionsNames() {
  let response = await axios.get('11.16.1/data/en_US/champion.json');
  let names = Object.keys(response.data.data).map((key) => {
    return response.data.data[key].name;
  });
  return  names.sort((a, b) => a - b);   
}
module.exports = {
  loadChampionsNames,
  nextChampionName
}

