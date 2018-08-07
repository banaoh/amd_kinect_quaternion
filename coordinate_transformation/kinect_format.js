const fs = require('fs');
const THREE = require('three');
const csvSync = require('./node_modules/csv-parse/lib/sync');

// 配列をcsvで保存するfunction
function exportCSV(content, output_filename){
  var formatCSV = '';
  content.splice(0, 3);

  for (var i = 0; i < content.length; i++) {

    // 1. データ間の空行の削除
    if( (i%27 != 25) && (i%27 != 26) ){
      var value = content[i];
      value.splice(0, 2); // time, frameデータの削除
      for (var j = 0; j < value.length; j++) {
        var innerValue = value[j]===null?'':value[j].toString();
        var result = innerValue.replace(/"/g, '""');

        if (result.search(/("|,|\n)/g) >= 0)
          result = '"' + result + '"';
        
        if (j > 0)
        formatCSV += ',';
        formatCSV += result;
      }
      // 文字列で保存される
      formatCSV += '\n';
    }
  }

  // 2. カンマ区切りにする
  var row_split = formatCSV.split('\n');
  var comma_split = [];
  var frame_data = [];
  for (var i = 0; i < row_split.length; i++) {
    // (1) カンマ区切りにする
    comma_split[i] = row_split[i].split(',');
    for (var j = 0; j < comma_split[i].length; j++) {
      comma_split[i][j] = parseFloat(comma_split[i][j]);
    }
    // (2) quaternionのみ抽出
    comma_split[i] = comma_split[i].slice(3,7);
  }

  // 3. Kinectデータの取得しきれていない行の削除
  var cut_rows_num = (comma_split.length )%25;
  comma_split.splice(comma_split.length - cut_rows_num, cut_rows_num);

  // 4. frameごとに保存する
  for (var i = 0; i < comma_split.length; i++) {
    for (var j = 0; j < comma_split[i].length; j++) {
      frame_data += comma_split[i][j];
      frame_data += ',';
    }
    if( (i+1) % 25 == 0){
      frame_data += '\n';
    }
  }



  fs.writeFile(output_filename, frame_data, 'utf8', function (err) {
    if (err) {
      console.log('保存できませんでした');
      console.log( 'エラー内容 : %s', err );
    } else {
      console.log('[ %s ] で保存しました', output_filename);
    }
  });
}

function main(){

  var data_path = "../datas/raw_datas/experiment/";

  fs.readdir(data_path, function(err, files){
    if (err) throw err;
    console.log(files);
    files.forEach( function(file){
      kinect_flag = new RegExp('ki_zen');  

      if (file.match( kinect_flag )) {
        console.log( file );

        var input_filename = data_path + file;
        var output_filename = "../datas/raw_datas/experiment/dataset/" + file;
        let raw_data = fs.readFileSync(input_filename);
        let contents = csvSync(raw_data);

        exportCSV(contents, output_filename);
      }
    });
  });

}

main();