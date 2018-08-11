const fs = require('fs');
const THREE = require('three');
const csvSync = require('csv-parse/lib/sync');
const csv = require('csv');


function init(){
  
  // fileの引数での指定
  // console.log(input_filename);
  var input_filename = process.argv[2].toString();
  fs.readFile(input_filename, 'utf-8', function (err,raw) {
  // fs.readFile("../datas/test_data_cut2.csv", 'utf-8', function (err,raw) {
    if (err) {
      return console.log(err);
    }
    // data ... mocap_ref（生データ）
    data = raw.split(/\r\n|\r|\n/);
    var comma_separated_normalized_data = [];
    var normalized_data_arr = [];

    for(var j=0; j < data.length; j++){
      data[j] = data[j].split(',');
      if(data[j].length != 1){
        var tmp_arr = [];
        var frame_array = [];
        var normalized_frame_array = [];
        var euler_frame_array_vec = [];
        var euler_frame_array = [];
        
        for (var i = 0; i < data[j].length; i++) {
          if( (i+1) % 4 == 0 ){
            tmp_arr.push(parseFloat(data[j][i]));

            var normalized_quaternion = new THREE.Quaternion().fromArray(tmp_arr).normalize();
            normalized_frame_array.push(normalized_quaternion);
            // eulerに変換

            for(var k = 0; k < normalized_quaternion.length; k++){
              frame_array.push(normalized_quaternion[k]);
            }
            tmp_arr = [];
          } else {
            tmp_arr.push(parseFloat(data[j][i]));
          }
        }
        // normalized & 100 length_data
        comma_separated_normalized_data.push(frame_array);
        normalized_data_arr.push(normalized_frame_array);
      }
    }
    applyNormRandToQuaternionVector(comma_separated_normalized_data);
    var nrand_added_quaternion_3degree = applyNormRandToQuaternionW(normalized_data_arr, 3);
    var nrand_added_quaternion_5degree = applyNormRandToQuaternionW(normalized_data_arr, 5);
    var nrand_added_quaternion_7degree = applyNormRandToQuaternionW(normalized_data_arr, 7);
    var nrand_added_quaternion_10degree = applyNormRandToQuaternionW(normalized_data_arr, 10);


    // var filtering_main_bone_joints = multiplyQuaternionMainBoneJoints(normalized_data_arr, window_size, true);
    // var filtering_spines = multiplyQuaternionSpine(normalized_data_arr, window_size, true);

    var front_file_name = input_filename.split(".csv") ;
    var nrand_added_quaternion_3degree_filename = front_file_name[0]  + "_3degree_added_3rd.csv";
    var nrand_added_quaternion_5degree_filename = front_file_name[0]  + "_5degree_added_3rd.csv";
    var nrand_added_quaternion_7degree_filename = front_file_name[0]  + "_7degree_added_3rd.csv";
    var nrand_added_quaternion_10degree_filename = front_file_name[0]  + "_10degree_added_3rd.csv";
    exportcsv(nrand_added_quaternion_3degree, nrand_added_quaternion_3degree_filename);
    exportcsv(nrand_added_quaternion_5degree, nrand_added_quaternion_5degree_filename);
    exportcsv(nrand_added_quaternion_7degree, nrand_added_quaternion_7degree_filename);
    // exportcsv(nrand_added_quaternion_10degree, nrand_added_quaternion_10degree_filename);

    return;
  });
}

function convertDegreeToRadian(degree) {
  return degree * Math.PI / 180;
};


/**
 * 正規分布乱数関数 参考:http://d.hatena.ne.jp/iroiro123/20111210/1323515616
 * @param number m 平均μ
 * @param number s 分散σ^2
 * @return number ランダムに生成された値
 */
var normRand = function (m, s) {
    var a = 1 - Math.random();
    var b = 1 - Math.random();
    var c = Math.sqrt(-2 * Math.log(a));
    if(0.5 - Math.random() > 0) {
        return c * Math.sin(Math.PI * 2 * b) * s + m;
    }else{
        return c * Math.cos(Math.PI * 2 * b) * s + m;
    }
};


// input.1 : all_frame( ( 25length array: Quaternion ) )
// input.2 : degree to make rand
// output : 100length array to write_csvfile
function applyNormRandToQuaternionW(input, degree){
  // Quaternionに+-5度の回転を加えたもの
  var nrand_added_quaternion = new Array(input.length);
  for (var frame = 0; frame < input.length; frame++) {
    var frame_arr = [];
    for (var bone_index = 0; bone_index < input[frame].length; bone_index++) {
      var gaussRandomNum = convertDegreeToRadian( normRand(100, degree) - 100 );
      var tmp_qua = new THREE.Quaternion( input[frame][bone_index].x,
                                          input[frame][bone_index].y,
                                          input[frame][bone_index].z,
                                          input[frame][bone_index].w + gaussRandomNum ).normalize().toArray();
      for (var  i = 0;  i < tmp_qua.length;  i++) {
        frame_arr.push( tmp_qua[i] );
      }
    }
    nrand_added_quaternion[frame] = frame_arr;
  }

  return nrand_added_quaternion;
}


function applyNormRandToQuaternionVector(input){
  for (var frame = 0; frame < input.length; frame++) {
    for (var bone_index = 0; bone_index < input[bone_index].length; bone_index++) {
      // console.log( input.length );
    }
  }
}



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
  // output_path = '../datas/converted_norot_dataset/euler/corrects/' + output_filename;
  console.log(output_filename);
  fs.writeFile( output_filename, finalVal, 'utf8', function (err) {
    if (err) {
        console.log('Some error occured - file either not saved or corrupted file saved.');
      } else{
          console.log('It\'s saved!');
        }
  });
}



init();