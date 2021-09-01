/** @format */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = 5000;
const axios = require('axios').create({
  baseURL: 'http://ddragon.leagueoflegends.com/cdn',
});

const URL = `http://10.42.0.39:${PORT}`;
const splashBaseURL =
  'http://ddragon.leagueoflegends.com/cdn/img/champion/splash';
const loadingBaseURL =
  'http://ddragon.leagueoflegends.com/cdn/img/champion/loading';
const tileBaseURL =
  'http://ddragon.leagueoflegends.com/cdn/11.16.1/img/champion';
const spellBaseURL = 'http://ddragon.leagueoflegends.com/cdn/11.16.1/img/spell';

let ChampionsGlobalObject = new Object();

app.use(cors());
app.options('*', cors());
app.use('/tiles', express.static(__dirname + '/Champions/Images/tiles'));
app.use('/loadings', express.static(__dirname + '/Champions/Images/loading'));
app.use('/splashes', express.static(__dirname + '/Champions/Images/splash'));
app.use('/spells', express.static(__dirname + '/Champions/Images/spell'));
app.use('/items', express.static(__dirname + '/Champions/Images/item'));
app.use('/passives', express.static(__dirname + '/Champions/Images/passive'));

//CLASSES

//FUNCTIONS
const init = async () => {
  const response = await axios.get('11.16.1/data/en_US/champion.json');
  ChampionsGlobalObject = response.data.data;
};
const loadChampionsNames = () => {
  let champions = ChampionsGlobalObject;
  let championsNames = new Array();
  for (const key in champions) {
    if (Object.hasOwnProperty.call(champions, key)) {
      championsNames.push(champions[key].id);
    }
  }
  return championsNames;
};
const champData = async (championName) => {
  try {
    let response = await axios.get(
      `11.16.1/data/en_US/champion/${championName}.json`
    );
    const data = response.data.data[championName];
    return data;
  } catch (error) {
    console.log(error);
  }
};
const readChampionObjectByIndex = async (index) => {
  let allChampionsNames = await loadChampionsNames();
  return await champData(allChampionsNames[index]);
};
const champSkinsDataObject = (champFullData) => {
  let champion = {};
  champion.name = champFullData.name;
  champion.id = champFullData.id;
  champion.skins = champFullData.skins.map((skin) => {
    return {
      name: skin.name,
      number: skin.num,
      tile: `${tileBaseURL}/${champion.id}.png`,
      loading: `${loadingBaseURL}/${champion.id}_${skin.num}.jpg`,
      splash: `${splashBaseURL}/${champion.id}_${skin.num}.jpg`,
    };
  });
  return champion;
};
const champDetailsObject = async (champFileName) => {
  try {
    let champObject = await champData(champFileName);
    return {
      key: champObject.key,
      name: champObject.name,
      id: champObject.id,
      title: champObject.title,
      tile: `${tileBaseURL}/${champObject.id}.png`,
    };
  } catch (error) {
    console.log(error);
  }
};
const prepareChampionsData = async () => {
  let championsFilesNames = loadChampionsNames();
  return await Promise.all(
    championsFilesNames.map(async (champFileName) => {
      let temp = await champDetailsObject(champFileName);
      return temp;
    })
  );
};
const abilityLetter = (index) => {
  switch (index) {
    case 0:
      return 'Q';
    case 1:
      return 'W';
    case 2:
      return 'E';
    case 3:
      return 'R';
  }
};
const randomAbility = async () => {
  const champsCount = loadChampionsNames().length - 1;
  let champIndex = Math.floor(Math.random() * champsCount);
  let abilityIndex = Math.floor(Math.random() * 4);
  let championFullData = await readChampionObjectByIndex(champIndex);
  let spell = {
    name: championFullData.spells[abilityIndex].name,
    id: championFullData.spells[abilityIndex].id,
    image: `${spellBaseURL}/${championFullData.spells[abilityIndex].image.full}`,
  };
  let answer = {
    champion: { key: championFullData.key, name: championFullData.name },
    spell: {
      id: championFullData.spells[abilityIndex].id,
      letter: abilityLetter(abilityIndex),
      image: `${spellBaseURL}/${championFullData.spells[abilityIndex].image.full}`,
    },
  };
  return {
    spell,
    answer,
  };
};

// ROUTUNG
app.get('/', async (req, res) => {
  let championName = await loadChampionsNames();
  let championData = await champData(championName[0]);
  let data = champSkinsDataObject(championData);
  res.send(data);
});
app.get('/championsData', (req, res) => {
  res.send(prepareChampionsData());
});
app.get('/championSkins/:champId', (req, res) => {
  let data = champSkinsDataObject(champData(req.params.champId));
  res.send(data);
});
app.get('/randomSpell', async (req, res) => {
  res.send(await randomAbility());
});
app.get('/loadAutoCompleteChampions', async (req, res) => {
  res.send(await prepareChampionsData());
});
app.get('/testing', async (req, res) => {
  res.send(ChampionsGlobalObject);
});
//STARTING SERVER
app.listen(process.env.PORT || PORT, async () => {
  await init();
  console.log(await prepareChampionsData());
});
