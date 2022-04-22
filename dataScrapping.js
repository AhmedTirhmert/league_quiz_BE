/** @format */

// IMPORTS
const RP = require('request-promise');
const cheerio = require('cheerio');
const {
  loadChampionsNames,
  nextChampionName,
} = require('./mixins/championsData');
const firebase = require('./mixins/firebase');
const express = require('express');

//SERVER COFIG
const app = express();
const PORT = 5000;

//VARIABLES
let championsNames;

//FUNCTIONS
const scrapSingleChampion = async (championName) => {
  let qts = {};
  let data = [];
  let data1 = [];
  qts[championName] = {};
  let url = `https://leagueoflegends.fandom.com/wiki/${championName}/LoL/Audio`;
  try {
    let response = await RP(url);
    // return
    const $ = cheerio.load(response);
    let quotesNumber = $('.mw-parser-output ul i').length;
    let audiosNumber = $(
      '.mw-parser-output ul li .audio-button .mediaContainer audio source'
    ).length;

    // PUSHING DATA INTO ARRAYS
    for (let j = 0; j < audiosNumber; j++) {
      data1.push(
        $('.mw-parser-output ul li .audio-button .mediaContainer audio source')[
          j
        ].attribs.src.replace(/\/revision(.*)/g, '')
      );
    }
    for (let i = 0; i < quotesNumber; i++) {
      data.push(
        $('.mw-parser-output ul li i')[i].children[0].data.replace(/\"/g, '')
      );
    }
    let recallindex = 0;

    // FILTERING DATA
    qts[championName]['vocals'] = data1.filter((link, index) => {
      return (
        // link.match(/^.*(Original|Select|Ban).*$/g) &&
        // link.match(/^.*(start|move|taunt|joke|Select|Ban).*$/g) 
        // &&
        !link.match(
          /^.*(laugh|dance|Dance|recall|Death|dying|Laugh|BasicAttack|Attack|attack|sell.|spell|unknown.|tower|Mecha|Gravelord|SpaceGroove|Zombie|BattleBoss|E|Q|W|return|YordleTrap|HeadshotMissile|PiltoverPeacemaker|BuyItem|UseItem|Respawn|AceintheHole|Program|Coven|HealthPotion|ward|item|use|R_|DarkStar|BattleCast|R).*$/g
        )
        // true
        // FlashFrost|Crystallize|GlacialStorm|Festival|CosmicFlight|Frostbite|taunt|INNATEgetGeneric|lowhealth|death|Male|Female
      );
    });
    qts[championName]['quotes'] = data.filter((quote) => {
      return (
        !quote.match(
          /^.*(Sound effect|Death sound|A beat plays|Music plays.|Okay...|Yeah!|See ya!|GG!|Hah.|Level).*$/g
        ) &&
        !quote.includes(championName) &&
        quote.length > 15
        // !quote.include('championName')
      );
      //   return !quote.includes(championName) && quote.length > 10;
    });

    return qts;
  } catch (error) {
    console.log(error);
    qts[championName]['url'] = url;
    return qts;
  }
};
const addChampionDataToFirestore = async (championData) => {
  for (const key in championData) {
    try {
      console.log(`uploading ${key} data`);
      await firebase.fireStore
        .collection('championsData')
        .doc(key)
        .create(championData[key]);
      console.log(`finished uploading ${key} data`);
    } catch (error) {
      console.log('error => ', error);
      return error;
    }
  }
};
const scrappAllChampions = async () => {
  return await Promise.all(
    championsNames.map(async (champion) => {
      let response = await scrapSingleChampion(champion);
      if (response != null) {
        addChampionDataToFirestore(response);
        return response;
      }
    })
  );
};
app.get('/dataScrapping/review', async (req, res) => {
  let champ = await nextChampionName(await firebase.getLastChampionName);
  console.log(champ);
  res.send(await scrapSingleChampion(champ));
});
app.get('/dataScrapping/upload', async (req, res) => {
  let champ = await nextChampionName(await firebase.getLastChampionName);
  let champData = await scrapSingleChampion(champ);
  await addChampionDataToFirestore(champData);
  res.send(`${Object.keys(champData)[0]} Uploaded successfully! ^_^`);
});

app.listen(process.env.PORT || PORT, async () => {
  championsNames = await loadChampionsNames();
});
