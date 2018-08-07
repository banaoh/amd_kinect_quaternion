const fs = require('fs');
const THREE = require('three');
const csvSync = require('csv-parse/lib/sync');
const csv = require('csv');


function init(){
  
  // fileの引数での指定
  // console.log(input_filename);
  var input_filename = process.argv[2].toString();
  var window_size = process.argv[3].toString();
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
        var count=0;
        
        for (var i = 0; i < data[j].length; i++) {
          if( (i+1) % 4 == 0 ){
            tmp_arr.push(parseFloat(data[j][i]));

            var normalized_quaternion;
            if(count==0){
              normalized_quaternion = new THREE.Quaternion().fromArray(tmp_arr).normalize().toArray();
              count++;
            } else {
              normalized_quaternion = new THREE.Quaternion().fromArray(tmp_arr).toArray();
            }
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
        // quaternion separated data (ex separated per 4 data)
        normalized_data_arr.push(normalized_frame_array);
      }
    }
    var filtered_data = movingAverageFilter(normalized_data_arr, window_size);
    // var filtered_data_by_euler = movingAverageFilterbyEuler(normalized_data_arr, window_size);
    var filtering_all_bone_joints = multiplyQuaternionMainBoneJoints(normalized_data_arr, window_size, false);
    var filtering_main_bone_joints = multiplyQuaternionMainBoneJoints(normalized_data_arr, window_size, true);
    var filtering_spines = multiplyQuaternionSpine(normalized_data_arr, window_size, true);

    var one_euro_filtering_main_bone_joints = multiplyQuaternionMainBoneJoints_1Euro(normalized_data_arr);



    var comma_separated_filtered_data = new Array(filtered_data.length);
    for (var frame = 0; frame < filtered_data.length; frame++) {
      var tmp_arr = [];

      // ここでnormalizeする
      for (var bone_index = 0; bone_index < filtered_data[frame].length; bone_index++) {
        var tmp_quaternion = new THREE.Quaternion().fromArray(filtered_data[frame][bone_index]).normalize().toArray();

        for (var i = 0; i < filtered_data[frame][bone_index].length; i++) {
          tmp_arr.push( tmp_quaternion[i] );
        }
      }
      comma_separated_filtered_data[frame] = tmp_arr;
    }

    var front_file_name = input_filename.split(".csv")[0];
    var normalized_data_filename = front_file_name + "_root_normalized.csv";
    var moving_averaged_data_filename = front_file_name + "_moving_averaged_" + window_size + "contexts_root_normalized.csv";
    var moving_averaged_data_using_euler_filename = front_file_name + "_moving_averaged_using_euler_" + window_size + "contexts_root_normalized.csv";
    var moving_averaged_data_using_all_bone_joints_filename = front_file_name + "_moving_averaged_using_all_bone_joints_qua_" + window_size + "contexts_root_normalized.csv";
    var moving_averaged_data_using_main_bone_joints_filename = front_file_name + "_moving_averaged_using_main_bone_joints_qua_" + window_size + "contexts_root_normalized.csv";
    var moving_averaged_data_using_spine_filename = front_file_name + "_moving_averaged_using_spine_qua_" + window_size + "contexts_root_normalized.csv";

    var one_euro_filtering_data_using_all_bone_joints_filename = front_file_name + "_one_euro_filtering_using_all_bone_joints.csv";

    exportcsv(comma_separated_normalized_data, normalized_data_filename);
    exportcsv(comma_separated_filtered_data, moving_averaged_data_filename);
    // exportcsv(filtered_data_by_euler, moving_averaged_data_using_euler_filename);
    exportcsv(filtering_all_bone_joints, moving_averaged_data_using_all_bone_joints_filename);
    exportcsv(filtering_main_bone_joints, moving_averaged_data_using_main_bone_joints_filename);
    exportcsv(filtering_spines, moving_averaged_data_using_spine_filename);
    
    exportcsv(one_euro_filtering_main_bone_joints, one_euro_filtering_data_using_all_bone_joints_filename);


    return;
  });
}



function multiplyQuaternionMainBoneJoints(input, w_size, bone_filter){
  // console.log( input[1] );

  var normalized_quaternion = new Array(input.length);
  for (var frame = 0; frame < input.length; frame++) {
    var tmp_arr = [];

    for (var bone_index = 0; bone_index < input[frame].length; bone_index++) {
      var tmp_qua = new THREE.Quaternion().fromArray(input[frame][bone_index]);
      tmp_arr.push( tmp_qua );
    }
    normalized_quaternion[frame] = tmp_arr;
  }

  var quaternionArray = new Array(input.length);
  for (var frame = 0; frame < input.length; frame++) {
    var tmp_arr = [];
    var tmp_arr_by_euler = [];

    if( (frame < Math.ceil(w_size/2)) || (frame> input.length - (Math.ceil(w_size/2) +1 )) ){
      for (var bone_index = 0; bone_index < input[frame].length; bone_index++) {
        var tmp_qua = normalized_quaternion[frame][bone_index].toArray();

        for (var i = 0; i < tmp_qua.length; i++) {
          tmp_arr.push( tmp_qua[i] );
        }
      }
    } else {
      for (var bone_index = 0; bone_index < input[frame].length; bone_index++) {
        var total_arr = [0, 0, 0, 0];
        
        // フィルタ適用 bone
        if( bone_filter == true ){
          if(     (bone_index == 0) || (bone_index == 1) || (bone_index == 2) || (bone_index == 20)|| (bone_index == 3)
               
               || (bone_index == 12)  || (bone_index == 16)|| (bone_index == 14)  || (bone_index == 18)){
            for (var i = (-1)*Math.ceil(w_size/2); i < Math.ceil(w_size/2) + 1; i++) {
              var tmp_qua = normalized_quaternion[frame + i][bone_index].toArray();
              for (var j = 0; j < total_arr.length; j++) {
                total_arr[j] += tmp_qua[j]/w_size;
              }
            }
          } else {
            total_arr = normalized_quaternion[frame][bone_index].toArray();
          }
        } else {
          for (var i = (-1)*Math.ceil(w_size/2); i < Math.ceil(w_size/2) + 1; i++) {
            var tmp_qua = normalized_quaternion[frame + i][bone_index].toArray();
            for (var j = 0; j < total_arr.length; j++) {
              total_arr[j] += tmp_qua[j]/w_size;
            }
            // total_arr[3] = normalized_quaternion[frame][bone_index].w;
          }
        }

        var average_qua;
        if(bone_index==0){
          average_qua = new THREE.Quaternion(total_arr[0], total_arr[1], total_arr[2], total_arr[3]).normalize().toArray();
        } else{
          average_qua = new THREE.Quaternion(total_arr[0], total_arr[1], total_arr[2], total_arr[3]).toArray();
        }
        for (var i = 0; i < average_qua.length; i++) {
          tmp_arr.push( average_qua[i] );
        }
      }
    }
    quaternionArray[frame] = tmp_arr;
  }

  return quaternionArray;
}


function multiplyQuaternionSpine(input, w_size, bone_filter){
  // console.log( input[1] );

  var normalized_quaternion = new Array(input.length);
  for (var frame = 0; frame < input.length; frame++) {
    var tmp_arr = [];

    for (var bone_index = 0; bone_index < input[frame].length; bone_index++) {
      var tmp_qua = new THREE.Quaternion().fromArray(input[frame][bone_index]);
      tmp_arr.push( tmp_qua );
    }
    normalized_quaternion[frame] = tmp_arr;
  }

  var quaternionArray = new Array(input.length);
  for (var frame = 0; frame < input.length; frame++) {
    var tmp_arr = [];
    var tmp_arr_by_euler = [];

    if( (frame < Math.ceil(w_size/2)) || (frame> input.length - (Math.ceil(w_size/2) +1 )) ){
      for (var bone_index = 0; bone_index < input[frame].length; bone_index++) {
        var tmp_qua = normalized_quaternion[frame][bone_index].toArray();

        for (var i = 0; i < tmp_qua.length; i++) {
          tmp_arr.push( tmp_qua[i] );
        }
      }
    } else {
      for (var bone_index = 0; bone_index < input[frame].length; bone_index++) {
        var total_arr = [0, 0, 0, 0];
        
        // フィルタ適用 bone
        if( bone_filter == true ){
          if(     (bone_index == 0) || (bone_index == 1) || (bone_index == 2) || (bone_index == 20) || (bone_index == 3)){
            for (var i = (-1)*Math.ceil(w_size/2); i < Math.ceil(w_size/2) + 1; i++) {
              var tmp_qua = normalized_quaternion[frame + i][bone_index].toArray();
              for (var j = 0; j < total_arr.length; j++) {
                total_arr[j] += tmp_qua[j]/w_size;
              }
            }
          } else {
            total_arr = normalized_quaternion[frame][bone_index].toArray();
          }
        } else {
          for (var i = (-1)*Math.ceil(w_size/2); i < Math.ceil(w_size/2) + 1; i++) {
            var tmp_qua = normalized_quaternion[frame + i][bone_index].toArray();
            for (var j = 0; j < total_arr.length; j++) {
              total_arr[j] += tmp_qua[j]/w_size;
            }
          }
        }
        var average_qua = new THREE.Quaternion(total_arr[0], total_arr[1], total_arr[2], total_arr[3]).normalize().toArray();
        for (var i = 0; i < average_qua.length; i++) {
          tmp_arr.push( average_qua[i] );
        }
      }
    }
    quaternionArray[frame] = tmp_arr;
  }

  return quaternionArray;
}


// input 1 : data[frame][bones(quaternion values in array)];
// input 2 : window size
// output : all_frame_data (Array[frame][bones(quaternion values in array)])
function movingAverageFilterbyEuler(input_data, window_size){

  // 1. eulerに変換
  var euler_from_normalized_quaternion = new Array(input_data.length);
  for (var frame = 0; frame < input_data.length; frame++) {
    var tmp_arr = [];

    for (var bone_index = 0; bone_index < input_data[frame].length; bone_index++) {      
      var tmp_euler = new THREE.Euler().setFromQuaternion( new THREE.Quaternion().fromArray(input_data[frame][bone_index]) ).toArray();
      tmp_arr.push( tmp_euler );
    }
    euler_from_normalized_quaternion[frame] = tmp_arr;
  }
  // console.log( '===== 移動平均前のrootの回転 =====' );
  // for (var i = 0; i < 20; i++) {
  //   console.log( i + " => x:" + euler_from_normalized_quaternion[i][0][0] + ", y : " + euler_from_normalized_quaternion[i][0][1] + ", z : " + euler_from_normalized_quaternion[i][0][2] );
  // }
  // console.log( '===== 移動平均後のrootの回転 =====' );



  var output_data = new Array(euler_from_normalized_quaternion.length);
  for (var frame = 0; frame < euler_from_normalized_quaternion.length; frame++) {

    var tmp_array = [];
    for (var bone_index = 0; bone_index < euler_from_normalized_quaternion[frame].length; bone_index++) {

      var total = [0, 0, 0];
      var count = 0;
      var pi = 3.141592;
      var minus_pi = -3.141592;

      // 1. frameが片側window_sizeを下回るとき
      if( frame < ( Math.ceil(window_size/2) - 1) ){
        // (1). frame以下の加算
        for(var i = frame; i>=0; i--){
          for (var j = 0; j < 3; j++) {
            if(euler_from_normalized_quaternion[i][bone_index][j] < 0){
              total[j] += 2*pi + euler_from_normalized_quaternion[i][bone_index][j];
            } else {
              total[j] += euler_from_normalized_quaternion[i][bone_index][j];
            }
          }
          count++;
        }
        // (2). frameより上の値の加算
        for (var i = frame + 1; i <= frame+(Math.ceil(window_size/2) - 1); i++) {
          for (var j = 0; j < 3; j++) {
            if(euler_from_normalized_quaternion[i][bone_index][j] < 0){
              total[j] += 2*pi + euler_from_normalized_quaternion[i][bone_index][j];
            } else {
              total[j] += euler_from_normalized_quaternion[i][bone_index][j];
            }
            // total[j] += euler_from_normalized_quaternion[i][bone_index][j];
          }
          count++;
        }
      // 2. frameが片側window_sizeを超えるとき
      } else if( frame + (Math.ceil(window_size/2) - 1) > euler_from_normalized_quaternion.length - 1 ) {
        // (1). frameより小さいの値の加算
        for (var i = (Math.ceil(window_size/2) - 1); i > 0; i--) {
          for (var j = 0; j < 3; j++) {
            if(euler_from_normalized_quaternion[frame - i][bone_index][j] < 0){
              total[j] += 2*pi + euler_from_normalized_quaternion[frame - i][bone_index][j];
            } else {
              total[j] += euler_from_normalized_quaternion[frame - i][bone_index][j];
            }
            // total[j] += euler_from_normalized_quaternion[frame - i][bone_index][j];
          }
          count++;
        }
        // (2). frameより以上の値の加算
        for(var i = frame ; i < euler_from_normalized_quaternion.length; i++){
          for (var j = 0; j < 3; j++) {
            if(euler_from_normalized_quaternion[i][bone_index][j] < 0){
              total[j] += 2*pi + euler_from_normalized_quaternion[i][bone_index][j];
            } else {
              total[j] += euler_from_normalized_quaternion[i][bone_index][j];
            }
            // total[j] += euler_from_normalized_quaternion[i][bone_index][j];
          }
          count++;
        }
      // 3. frameがwindow内に収まっているときの処理
      } else {
        // (1). frameより小さい値の加算
        for (var i = (Math.ceil(window_size/2) - 1); i > 0; i--) {
          for (var j = 0; j < 3; j++) {
            if(euler_from_normalized_quaternion[frame - i][bone_index][j] < 0){
              total[j] += 2*pi + euler_from_normalized_quaternion[frame - i][bone_index][j];
            } else {
              total[j] += euler_from_normalized_quaternion[frame - i][bone_index][j];
            }
            // total[j] += euler_from_normalized_quaternion[frame - i][bone_index][j];
          }
          count++;
        }
        // (1). frame以上の加算
        for (var i = frame; i <= frame+(Math.ceil(window_size/2) - 1); i++) {
          for (var j = 0; j < 3; j++) {
            if(euler_from_normalized_quaternion[i][bone_index][j] < 0){
              total[j] += 2*pi + euler_from_normalized_quaternion[i][bone_index][j];
            } else {
              total[j] += euler_from_normalized_quaternion[i][bone_index][j];
            }
            // total[j] += euler_from_normalized_quaternion[i][bone_index][j];
          }
          count++;
        }
      }

      for (var i = 0; i < 3; i++) {
        if( (total[i]/count) > pi ){
          total[i] = (-1)*( 2*pi - total[i]/count );
        } else {
          total[i] = total[i]/count;
        }
      }


      var average_euler = new THREE.Euler().fromArray([total[0], total[1], total[2]]);
      var tmp_quaternion = new THREE.Quaternion().setFromEuler(average_euler).toArray();

      // if( frame < 20 ){
      //   if( bone_index == 0 ){
      //     console.log( frame + " => x:" + average_euler.x + ", y : " + average_euler.y + ", z : " + average_euler.z );
      //   }
      // }


      for (var i = 0; i < tmp_quaternion.length; i++) {
        tmp_array.push( tmp_quaternion[i] );
      }
    }

    output_data[frame] = tmp_array;
  }
  return output_data;
}


// input 1 : data[frame][bones(quaternion values in array)];
// input 2 : window size
// output : all_frame_data (Array[frame][bones(quaternion values in array)])
function movingAverageFilter(input_data, window_size){
  var output_data = new Array(input_data.length);
  for (var frame = 0; frame < input_data.length; frame++) {
    var tmp_arr = new Array(input_data[frame].length);
    for (var bone_index = 0; bone_index < input_data[frame].length; bone_index++) {
      var total = 0;
      var count = 0;

      // 1. frameが片側window_sizeを下回るとき
      if( frame < ( Math.ceil(window_size/2) - 1) ){
        // 1. frame以下の加算
        for(var i = frame; i>=0; i--){
          total += input_data[i][bone_index][3];
          count++;
        }
        // 2. frameより上の値の加算
        for (var i = frame + 1; i <= frame+(Math.ceil(window_size/2) - 1); i++) {
          total += input_data[i][bone_index][3];
          count++;
        }
        tmp_arr[bone_index]= [ input_data[frame][bone_index][0],
                               input_data[frame][bone_index][1],
                               input_data[frame][bone_index][2],
                               total/count ];

      // 2. frameが片側window_sizeを超えるとき
      } else if( frame + (Math.ceil(window_size/2) - 1) > input_data.length - 2 ) {
        // 1. frameより小さいの値の加算
        for (var i = (Math.ceil(window_size/2) - 1); i > 0; i--) {
          total += input_data[frame-i][bone_index][3];
          count++;
        }
        // 2. frameより以上の値の加算
        for(var i = frame ; i < input_data.length; i++){
          total += input_data[i][bone_index][3];
          count++;
        }
        tmp_arr[bone_index] = [ input_data[frame][bone_index][0],
                               input_data[frame][bone_index][1],
                               input_data[frame][bone_index][2],
                               total/count ];
                               
      // 3. frameがwindow内に収まっているときの処理
      } else {
        // 1. frameより小さい値の加算
        for (var i = (Math.ceil(window_size/2) - 1); i > 0; i--) {
          total += input_data[frame-i][bone_index][3];
          count++;
        }
        // 2. frame以上の加算
        for (var i = frame; i <= frame+(Math.ceil(window_size/2) - 1); i++) {
          // console.log( frame );
          total += input_data[i][bone_index][3];
          count++;
        }
        tmp_arr[bone_index] = [  input_data[frame][bone_index][0],
                                 input_data[frame][bone_index][1],
                                 input_data[frame][bone_index][2],
                                 total/count ];
      }
    }
    output_data[frame] = tmp_arr;
  }
  return output_data;
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

/**
 * Author: Florian Renaut (florian.renaut@gmail.com)
 * Details: http://www.lifl.fr/~casiez/1euro
 */

function OneEuroFilter(freq, mincutoff, beta, dcutoff){
  var that = {};
  var x = LowPassFilter(alpha(mincutoff));
  var dx = LowPassFilter(alpha(dcutoff));
  var lastTime = undefined;
  
  mincutoff = mincutoff || 1;
  beta = beta || 0;
  dcutoff = dcutoff || 1;
  
  function alpha(cutoff){
    var te = 1 / freq;
    var tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / te);
  }
  
  that.filter = function(v, timestamp){
    if(lastTime !== undefined && timestamp !== undefined)
      freq = 1 / (timestamp - lastTime);
    lastTime = timestamp;
    var dvalue = x.hasLastRawValue() ? (v - x.lastRawValue()) * freq : 0;
    var edvalue = dx.filterWithAlpha(dvalue, alpha(dcutoff));
    var cutoff = mincutoff + beta * Math.abs(edvalue);
    return x.filterWithAlpha(v, alpha(cutoff));
  }
  
  return that;
}

function LowPassFilter(alpha, initval){
  var that = {};
  var y = initval || 0;
  var s = y;
  
  function lowpass(v){
    y = v;
    s = alpha * v + (1 - alpha) * s;
    return s;
  }
  
  that.filter = function(v){
    y = v;
    s = v;
    that.filter = lowpass;
    return s;
  }
  
  that.filterWithAlpha = function(v, a){
    alpha = a;
    return that.filter(v);
  }
  
  that.hasLastRawValue = function(){
    return that.filter === lowpass;
  }
  
  that.lastRawValue = function(){
    return y;
  }
  
  return that;
}

function multiplyQuaternionMainBoneJoints_1Euro(input){
  // console.log( input[1] );

  var all_qua = new Array(4);
  for (var  i = 0;  i < 4;  i++) {
    all_qua[i] = new Array(25);
  }

  var normalized_quaternion_x = new Array(25);
  var normalized_quaternion_y = new Array(25);
  var normalized_quaternion_z = new Array(25);
  var normalized_quaternion_w = new Array(25);


  for (var i = 0;  i < 4;  i++) {
    for (var  bone_index = 0;  bone_index < 25;  bone_index++) {
      var tmp_arr = [];
      var one_euro_filter = new OneEuroFilter(30, 0.1, 3, 1.0);

      for (var frame = 0; frame < input.length; frame++) {
        if(frame==0){
          tmp_arr.push( one_euro_filter.filter( input[frame][bone_index][i], 0));
        } else {
          tmp_arr.push( one_euro_filter.filter( input[frame][bone_index][i], frame/30));
        }
      }
      all_qua[i][bone_index] = tmp_arr;
    }
  }
  // console.log( all_qua[0][0].length );

  // for (var  bone_index = 0;  bone_index < 25;  bone_index++) {
  //   var tmp_arr_x = [];
  //   var tmp_arr_y = [];
  //   var tmp_arr_z = [];
  //   var tmp_arr_w = [];
  //   for (var frame = 0; frame < input.length; frame++) {
  //     tmp_arr_x.push(input[frame][bone_index][0]);
  //     tmp_arr_y.push(input[frame][bone_index][1]);
  //     tmp_arr_z.push(input[frame][bone_index][2]);
  //     tmp_arr_w.push(input[frame][bone_index][3]);
  //   }
  //   normalized_quaternion_x[bone_index] = tmp_arr_x;
  //   normalized_quaternion_y[bone_index] = tmp_arr_y;
  //   normalized_quaternion_z[bone_index] = tmp_arr_z;
  //   normalized_quaternion_w[bone_index] = tmp_arr_w;
  // }
  // console.log( normalized_quaternion_x.length );

  var all_filtered_data = new Array(input.length);
  for (var frame = 0; frame < input.length; frame++) {
    var frame_arr = [];
    for (var bone_index = 0; bone_index < 25; bone_index++) {
      var filtered_data = new Array(4);
      for (var  i = 0;  i < 4;  i++) {
        filtered_data[i] = all_qua[i][bone_index][frame];
      }

      var filtered_quaternion;
      if(bone_index==0){
        filtered_quaternion = new THREE.Quaternion().fromArray(filtered_data).normalize().toArray();
      } else {
        filtered_quaternion = new THREE.Quaternion().fromArray(filtered_data).toArray();
      }
      for (var  i = 0;  i < 4;  i++) {
        frame_arr.push(filtered_quaternion[i]);
      }
    }
    all_filtered_data[frame] = frame_arr;
  }





  // var normalized_quaternion = new Array(input.length);
  // for (var frame = 0; frame < input.length; frame++) {
  //   var tmp_arr = [];

  //   for (var bone_index = 0; bone_index < input[frame].length; bone_index++) {
  //     var tmp_qua = new THREE.Quaternion().fromArray(input[frame][bone_index]);
  //     tmp_arr.push( tmp_qua );
  //   }
  //   normalized_quaternion[frame] = tmp_arr;
  // }

  // // console.log( normalized_quaternion[0][0] );

  // var quaternionArray = new Array(input.length);
  // for (var frame = 0; frame < input.length; frame++) {
  //   var tmp_arr = [];
  //   var tmp_arr_by_euler = [];

  //   // function OneEuroFilter(freq, mincutoff, beta, dcutoff){
  //   // 'freq': 20,       # Hz
  //   // 'mincutoff': 0.1,  # FIXME
  //   // 'beta': 0.08,       # FIXME
  //   // 'dcutoff': 1.0

  //   var one_euro_filter = new OneEuroFilter(30, 0.1, 0.08, 1.0);

  //   for (var bone_index = 0; bone_index < input[frame].length; bone_index++) {
  //     var total_arr = [0, 0, 0, 0];

  //     var tmp_qua = normalized_quaternion[frame][bone_index].toArray();
      
  //     for (var  i = 0;  i < 4;  i++) {
  //       if(frame == 0){
  //         total_arr[i] = one_euro_filter.filter(tmp_qua[i], 0);
  //       } else {
  //         total_arr[i] = one_euro_filter.filter(tmp_qua[i], frame/30);
  //       }
  //     }






  //     var average_qua = new THREE.Quaternion(total_arr[0], total_arr[1], total_arr[2], total_arr[3]).normalize().toArray();

  //     for (var i = 0; i < average_qua.length; i++) {
  //       tmp_arr.push( average_qua[i] );
  //     }
  //   }
    
  //   quaternionArray[frame] = tmp_arr;
  // }

  return all_filtered_data;
}


init();