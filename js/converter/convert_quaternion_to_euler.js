const fs = require('fs');
const THREE = require('three');
const csv = require('csv');

// phpのarray_chunk的なメソッド
// 配列を引数ごとに分割
Array.prototype.chunk = function(n){
    len = Math.round(this.length/n,10)
    ret = []
    for(var i=0;i<len;i++){
        ret.push( this.slice( i*n, i*n+n )  )
    }
    return ret;
}
var count_val=0;


// file名を引数で指定
var file_num = process.argv[2].toString();

// var input_filename = "kinect_" + file_num + ".csv"
var input_filename = "mocap_" + file_num + ".csv"
console.log(input_filename);
fs.readFile('../datas/converted_norot_dataset/' + input_filename, 'utf-8', function (err,raw) {
// fs.readFile("../datas/test_data_cut2.csv", 'utf-8', function (err,raw) {
  if (err) {
    return console.log(err);
  }
  // data ... mocap_ref（生データ）
  data = raw.split(/\r\n|\r|\n/);
  var mocap_ref = new Array(data.length-1);
  var kinect_output_data = new Array(data.length-1);
  var kinect_csv = new Array(data.length-1);
  var testArr = [0,0,0];

  var converted_data = [];


  for(var j=0; j < data.length; j++){
    data[j] = data[j].split(',');

    var tmp_arr = [];
    var frame_array = [];
    
    for (var i = 0; i < data[j].length; i++) {
      if( (i+1) % 4 == 0 ){
        tmp_arr.push(parseFloat(data[j][i]));

        // eulerに変換
        var euler_i = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().fromArray(tmp_arr), 'XYZ').toArray();
        // console.log( new THREE.Euler().setFromQuaternion(new THREE.Quaternion().fromArray(tmp_arr), 'XYZ').toArray(this));
        for(var k = 0; k < euler_i.length - 1; k++){
          frame_array.push(euler_i[k]);
        }

        tmp_arr = [];
      } else {
        tmp_arr.push(parseFloat(data[j][i]));
      }
    }
    converted_data.push(frame_array);
  }

  exportcsv(converted_data, input_filename);

  return;
});

// 配列をcsvで保存するfunction
function exportcsv(content, output_filename){
  var finalVal = '';
  var fs = require('fs');
  for (var i = 0; i < content.length; i++) {
      var value = content[i];
   
      for (var j = 0; j < value.length; j++) { var innerValue = value[j]===null?'':value[j].toString(); var result = innerValue.replace(/"/g, '""'); if (result.search(/("|,|\n)/g) >= 0)
      result = '"' + result + '"';
      if (j > 0)
      finalVal += ',';
      finalVal += result;
    }
    finalVal += '\n';
  }
  // output_path = '../datas/converted_norot_dataset/euler/inputs/' + output_filename;
  output_path = '../datas/converted_norot_dataset/euler/corrects/' + output_filename;
  console.log(output_path);
  fs.writeFile( output_path, finalVal, 'utf8', function (err) {
    if (err) {
        console.log('Some error occured - file either not saved or corrupted file saved.');
      } else{
          console.log('It\'s saved!');
        }
  });
}
