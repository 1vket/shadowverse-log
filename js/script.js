
//const { ipcRenderer } = require('electron');

const fs = require('fs');

var sheet_num=1;
var data;

function load_json() {
  //ファイルをロードしてdataに格納
  var files = fs.readdirSync('sheets/');
  if (files.length == 0){
    create_sheet();
    sheet_num = 1;
  }
  var json_filename = 'sheets/'+sheet_num+'.json';
  var file = fs.readFileSync(json_filename, {encoding: "utf8"});
  data = JSON.parse(file);
  title_box.value = data.title;
}


function save_json() {
  //dataをjsonファイルに出力
  var json_filename = 'sheets/'+sheet_num+'.json';
  fs.writeFileSync(json_filename, JSON.stringify(data));
}

function reset_selectbox(selectbox) {
  for (var i = selectbox.options.length-1; 0 <= i; i--){
    selectbox.removeChild(selectbox.options[i]);
  }
}

var title_box = document.getElementById("title-box");

title_box.addEventListener('change', (e)=> {
  data.title = title_box.value;
  save_json();
  set_selectbox();
});

var sheet_num_selectbox = document.getElementById("sheet-no");

sheet_num_selectbox.addEventListener('change', (e)=> {
  sheet_num = e.target.value;
  load_json();
  console.log(data);
  console.log(sheet_num);
});

function create_sheet() {
  var original_json = '{"title":"default","decks":{"E":[],"R":[],"W":[],"D":[],"Nc":[],"V":[],"B":[],"Nm":[]},"record":[]}';
  var files = fs.readdirSync('sheets/'); 
  fs.writeFileSync(('sheets/'+(files.length + 1))+'.json', original_json);
}

var new_sheet_button = document.getElementById('new-btn');

new_sheet_button.addEventListener('click', (e) => {
  create_sheet();
  set_selectbox();
});

var me_lclass_selectbox = document.getElementById("me-class");
var me_deck_selectbox = document.getElementById("me-deck");
var enm_lclass_selectbox = document.getElementById("enm-class");
var enm_deck_selectbox = document.getElementById("enm-deck");

me_lclass_selectbox.addEventListener('change', (e)=>{
  reset_selectbox(me_deck_selectbox);
  for(let deck of data.decks[me_lclass_selectbox.value]) {
    const option = document.createElement('option');
    option.value = deck;
    option.innerHTML = deck;
    me_deck_selectbox.appendChild(option);
  }
});

enm_lclass_selectbox.addEventListener('change', (e)=>{
  reset_selectbox(enm_deck_selectbox);
  for(let deck of data.decks[enm_lclass_selectbox.value]) {
    const option = document.createElement('option');
    option.value = deck;
    option.innerHTML = deck;
    enm_deck_selectbox.appendChild(option);
  }
});

var rita_check = document.getElementById("rita-check");
var win_button = document.getElementById("win-btn");
var lose_button = document.getElementById("lose-btn");

function int2str(i){
  return ('000' + i).slice(-2);
}

function add_data(winlose) {
  var date = new Date();
  var year = int2str(date.getFullYear() % 100);
  var month = int2str(date.getMonth() + 1);
  var day = int2str(date.getDate());
  var hour = int2str(date.getHours());
  var minute = int2str(date.getMinutes());
  var second = int2str(date.getSeconds());

  var timestamp = year+month+day+hour+minute+second;
  var me_cls = me_lclass_selectbox.value ? me_lclass_selectbox.value : 'None';
  var me_deck = me_deck_selectbox.value ? me_deck_selectbox.value : 'None';
  var enm_cls = enm_lclass_selectbox.value ? enm_lclass_selectbox.value : 'None';
  var enm_deck = enm_deck_selectbox.value ? enm_deck_selectbox.value : 'None';
  var rita = rita_check.checked ? '1' : '0';
  rita_check.checked = false;
  var colmn = timestamp+'\t'+me_cls+'\t'+me_deck+'\t'+enm_cls+'\t'+enm_deck+'\t'+rita+'\t'+winlose
  data.record.push(colmn);
  save_json();
  set_record();
}

win_button.addEventListener('click', (e) => {
  add_data('1');
});

lose_button.addEventListener('click', (e) => {
  add_data('0');
});


var deckname = document.getElementById("deck-name");
var deckclass = document.getElementById("deck-class");
var deck_add_button = document.getElementById("deck-add-btn");

deck_add_button.addEventListener('click', (e) => {
  var name = deckname.value.replaceAll('　','').replaceAll(' ','');
  var f=true;
  for(let v in data.decks[deckclass.value]){
    if (v == name){
      f = false;
    }
  }
  if ((name != "")&&(f)){
    data.decks[deckclass.value].push(deckname.value);
  }
  deckname.value = '';
  set_record_select();
  save_json();
});

function set_selectbox(){
  reset_selectbox(sheet_num_selectbox);
  // json一覧をロードし、num selectboxに表示
  var files = fs.readdirSync('sheets/');
  for (let file of files){
    var json_file = fs.readFileSync("sheets/"+file, {encoding: "utf8" });
    var d = JSON.parse(json_file);
    const option = document.createElement('option');
    option.value = file.match(/\d+/)[0];
    option.innerHTML = d.title;
    if (d.title == data.title){
      option.value.selected = true;
    }
    sheet_num_selectbox.appendChild(option);
  }
}

var record_table = document.getElementById('record-table');

var record_set1 = document.getElementById('record-set1');
var record_set2 = document.getElementById('record-set2');

record_set1.addEventListener('change', (e) => {
  set_record();
});

record_set2.addEventListener('change', (e) => {
  set_record();
});

function set_record_select() {
  reset_selectbox(record_set1);
  reset_selectbox(record_set2);
  for (var cls in data.decks){
    for ( var deck of data.decks[cls]){
      const option = document.createElement('option');
      option.value = deck+cls;
      option.innerHTML = deck+cls;
      record_set1.appendChild(option);
      const option2 = document.createElement('option');
      option2.value = deck+cls;
      option2.innerHTML = deck+cls;
      record_set2.appendChild(option2);
    }
  }
}


function set_record(){
  // reset table
  while (record_table.rows.length > 1){
    record_table.deleteRow(-1);
  }


  var fight_sum = {'all':0, 'set1':0, 'set2':0};
  var win_sum = {'all':0, 'set1':0, 'set2':0};
  var fight = {};
  var win = {};

  for (var cls in data.decks){
    for ( var deck of data.decks[cls]){
      fight[deck+cls] = {"all":0,"set1":0,"set2":0};
      win[deck+cls] = {"all":0,"set1":0,"set2":0};
    }
  }

  for (var line of data.record){
    var lines = line.split('\t');
    var me = lines[2]+lines[1];
    var enm = lines[4]+lines[3];

    fight_sum['all'] += 1;
    win_sum['all'] += parseInt(lines[6]);

    if (enm in fight){
      fight[enm]['all'] += 1;
      win[enm]['all'] += parseInt(lines[6]);
    }

    if (record_set1.value==me){
      fight_sum['set1'] += 1;
      win_sum['set1'] += parseInt(lines[6]);
      fight[enm]['set1'] += 1;
      win[enm]['set1'] += parseInt(lines[6]);
    }
    if (record_set2.value==me){
      fight_sum['set2'] += 1;
      win_sum['set2'] += parseInt(lines[6]);
      fight[enm]['set2'] += 1;
      win[enm]['set2'] += parseInt(lines[6]);
    }
  }

  // show play
  var tr = document.createElement('tr');
  var td1 = document.createElement('td');
  td1.innerHTML = "プレイ回数";
  tr.appendChild(td1);
  var td2 = document.createElement('td');
  td2.innerHTML = fight_sum['all'].toFixed(1);
  tr.appendChild(td2);
  var td3 = document.createElement('td');
  td3.innerHTML = fight_sum['set1'].toFixed(1);
  tr.appendChild(td3);
  var td4 = document.createElement('td');
  td4.innerHTML = fight_sum['set2'].toFixed(1);
  tr.appendChild(td4);
  record_table.appendChild(tr);

  // show all
  var tr = document.createElement('tr');
  var td1 = document.createElement('td');
  td1.innerHTML = "all";
  tr.appendChild(td1);
  var td2 = document.createElement('td');
  td2.innerHTML = fight_sum['all']!=0 ? (win_sum['all']/fight_sum['all']*100).toFixed(1) : (0).toFixed(1);
  tr.appendChild(td2);
  var td3 = document.createElement('td');
  td3.innerHTML = fight_sum['set1']!=0 ? (win_sum['set1']/fight_sum['set1']*100).toFixed(1) : (0).toFixed(1);
  tr.appendChild(td3);
  var td4 = document.createElement('td');
  td4.innerHTML = fight_sum['set2']!=0 ? (win_sum['set2']/fight_sum['set2']*100).toFixed(1) : (0).toFixed(1);
  tr.appendChild(td4);
  record_table.appendChild(tr);

  // show cls
  for (var cls in data.decks){
    for ( var deck of data.decks[cls]){
      var tr = document.createElement('tr');
      var td1 = document.createElement('td');
      td1.innerHTML = deck+cls;
      tr.appendChild(td1);
      var td2 = document.createElement('td');
      td2.innerHTML = fight_sum['all']!=0 ? (fight[deck+cls]['all']/fight_sum['all']*100).toFixed(1) : (0).toFixed(1);
      tr.appendChild(td2);
      var td3 = document.createElement('td');
      td3.innerHTML = fight[deck+cls]['set1']!=0 ? (win[deck+cls]['set1']/fight[deck+cls]['set1']*100).toFixed(1) : (0).toFixed(1);
      tr.appendChild(td3);
      var td4 = document.createElement('td');
      td4.innerHTML = fight[deck+cls]['set2']!=0 ? (win[deck+cls]['set2']/fight[deck+cls]['set2']*100).toFixed(1) : (0).toFixed(1);
      tr.appendChild(td4);
      record_table.appendChild(tr);
    }
  }
}


function initScript(){
  // folder no sakusei
  fs.mkdir('sheets', (e) => {
    if (e){
      console.log('すでにあります');
      return;
    }
  });


  // jsonのロード
  load_json();

  set_selectbox();

  // leader class の selectbox に要素を追加
  var lclass = document.getElementsByClassName('lclass');
  for (let lcls of lclass) {
    Object.keys(data.decks).forEach(cls => {
      const option = document.createElement('option');
      option.value = cls;
      option.innerHTML = cls;
      lcls.appendChild(option);
    });
  }

  // 戦績を表示
  set_record_select();
  set_record();
}

initScript()



