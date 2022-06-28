/** @format */

const express = require('express');
const cors = require('cors');
const firebase = require('./mixins/firebase');
const fs = require('fs');
const app = express();
const PORT = 5000;
let patchVersion;
const axios = require('axios').create({
  baseURL: `http://ddragon.leagueoflegends.com/cdn/`,
});
const axiosBase = require('axios');
let splashBaseURL, loadingBaseURL, tileBaseURL, spellBaseURL, itemBaseURL;

let ChampionsGlobalObject = new Object();
let ItemsGlobalArray;
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
  patchVersion = await getCurrentPatchVersion();
  setBaseURLs();
  await setAxiosBaseURL();
  const champions = await axios.get('data/en_US/champion.json');
  const items = await axios.get('data/en_US/item.json');
  ChampionsGlobalObject = champions.data.data;
  ItemsGlobalArray = loadItemsArray(items.data.data);
};
const setBaseURLs = () => {
  splashBaseURL = `http://ddragon.leagueoflegends.com/cdn/img/champion/splash`;
  loadingBaseURL = `http://ddragon.leagueoflegends.com/cdn/img/champion/loading`;
  tileBaseURL = `http://ddragon.leagueoflegends.com/cdn/${patchVersion}/img/champion`;
  spellBaseURL = `http://ddragon.leagueoflegends.com/cdn/${patchVersion}/img/spell`;
  itemBaseURL = `https://ddragon.leagueoflegends.com/cdn/${patchVersion}/img/item`;
};
const loadItemsArray = (itemsObject) => {
  let temp = [];
  for (const itemId in itemsObject) {
    if (Object.hasOwnProperty.call(itemsObject, itemId)) {
      itemsObject[itemId].key = itemId;
      temp.push(itemsObject[itemId]);
    }
  }
  return temp;
};
const setAxiosBaseURL = () => {
  axios.defaults.baseURL += `${patchVersion}`;
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
    let response = await axios.get(`data/en_US/champion/${championName}.json`);
    const data = response.data.data[championName];
    return data;
  } catch (error) {
    console.log(error);
  }
};
const getCurrentPatchVersion = async () => {
  let response = await axiosBase.get(
    'https://ddragon.leagueoflegends.com/api/versions.json'
  );
  return response.data[0];
};
const readChampionObjectByIndex = async (index) => {
  let allChampionsNames = await loadChampionsNames();
  return await champData(allChampionsNames[index]);
};
const champSkinsDataObject = async (champFullData) => {
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
      // console.log('TEMP=>',temp);
      return temp;
    })
  );
};
//ABILITIES FUNCTIONS
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
  let i = 0;
  let spells = [];
  while (i < 10) {
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
    spells.push({ spell: spell, answer: answer });
    i++;
  }
  return spells;
};
//ITEMS FUNCTIONS
const randomItem = () => {
  const itemsCount = ItemsGlobalArray.length;
  const randomItemIndex = Math.floor(Math.random() * itemsCount);
  let item = {
    key: ItemsGlobalArray[randomItemIndex].key,
    name: ItemsGlobalArray[randomItemIndex].name,
    // from: ItemsGlobalArray[randomItemIndex].from,
    image: `${itemBaseURL}/${ItemsGlobalArray[randomItemIndex].image.full}`,
    // gold: ItemsGlobalArray[randomItemIndex].gold,
    // depth: ItemsGlobalArray[randomItemIndex].depth || null,
  };
  return item;
};
const prepareItemsData = async () => {
  return ItemsGlobalArray.map((item) => {
    let tempItem = {
      key: item.key,
      name: item.name,
    };
    return tempItem;
  });
};
const randomQuote = async () => {
  const championsData = await firebase.fireStore
    .collection('championsData')
    .get();
  let availableChampionsNames = championsData._docs().map((doc) => doc.id);
  const randomChampionIndex = Math.floor(
    Math.random() * availableChampionsNames.length
  );
  const championId = availableChampionsNames[randomChampionIndex];
  const championData = await firebase.fireStore
    .collection('championsData')
    .doc(championId)
    .get();
  let championQuotes = championData._fieldsProto.quotes.arrayValue.values;
  const randomQuoteIndex = Math.floor(Math.random() * championQuotes.length);
  const quote = championQuotes[randomQuoteIndex].stringValue;
  return {
    quote: quote,
    champion : championId
  };
};
const randomVocal = async () => {
  const championsData = await firebase.fireStore
    .collection('championsData')
    .get();
  let availableChampionsNames = championsData._docs().map((doc) => doc.id);
  const randomChampionIndex = Math.floor(
    Math.random() * availableChampionsNames.length
  );
  const championId = availableChampionsNames[randomChampionIndex];
  const championData = await firebase.fireStore
    .collection('championsData')
    .doc(championId)
    .get();
  let championVocals = championData._fieldsProto.vocals.arrayValue.values;
  const randomVocalIndex = Math.floor(Math.random() * championVocals.length);
  const vocal = championVocals[randomVocalIndex].stringValue;
  return {
    quote: vocal,
    champion : championId
  };
};
// ROUTUNG
app.get('/', async (req, res) => {
  let championName = await loadChampionsNames();
  let championData = await champData(championName[0]);
  let data = champSkinsDataObject(championData);
  res.send(data);
});
app.get('/championsData', async (req, res) => {
  res.send(await prepareChampionsData());
});
app.get('/championSkins/:champId', async (req, res) => {
  let championData = await champData(req.params.champId);
  let data = await champSkinsDataObject(championData);
  res.send(data);
});
app.get('/randomSpells', async (req, res) => {
  res.send(await randomAbility());
});
app.get('/loadAutoCompleteChampions', async (req, res) => {
  res.send(await prepareChampionsData());
});
app.get('/randomItem', async (req, res) => {
  res.send(randomItem());
});
app.get('/loadAutoCompleteItems', async (req, res) => {
  res.send(prepareItemsData());
});
app.get('/randomQuote', async (req, res) => {
  res.send(await randomQuote());
});
app.get('/randomVocal', async (req, res) => {
  res.send(await randomVocal());
});
//STARTING SERVER
app.listen(process.env.PORT || PORT, async () => {
  await init();
});
