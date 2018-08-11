const fs = require('fs');
const THREE = require('three');
const csv = require('csv');





var kinect_format_bone_length = [
  [ 0, 0, 0 ],          // root
  [ 0, 0.319953, 0 ],   // mid
  [ 0, 0.074989, 0 ],   // neck
  [ 0, 0.0749891, 0 ],  // head
  [ 0, 0.074989, 0 ],   // shoulder_left_between
  [ 0.209969, 0, 0 ],   // shoulder_left
  [ 0.20697, 0, 0 ],    // wrist_left
  [ 0.198971, 0, 0 ],   // hand_left
  [ 0.074989, 0, 0 ],   // shoulder_right_betweer
  [ -0.209969, 0, 0 ],  // shoulder_right
  [ -0.20697, 0, 0 ],   // wrist_right
  [ -0.198971, 0, 0 ],  // hand_right
  [ 0, 0.319953, 0 ],   // hip_left
  [ 0.0769887, -0.321953, 0 ],  // knee_left
  [ 0, -0.401941, 0 ],  // ankle_left
  [ 0, -0.332951, 0 ],  // foot_right
  [ 0, 0.319953, 0 ],   // hip_right
  [ -0.0769887, -0.321953, 0 ],  //knee_right
  [ 0, -0.401941, 0 ],  // ankle_right
  [ 0, -0.332951, 0],   // foot_right
  [ 0, 0.231966, 0 ],   // chest
  [ 0.0629908, 0, 0 ],  // thumb_left
  [ 0.0629908, 0, 0 ],  // hand_tip_left
  [ -0.0629908, 0, 0 ], // thumb_right
  [ -0.0629908, 0, 0 ] // hand_tip_right
];



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

// var load_filename = 'mocap-2017-0706-0538_formatted';
// var load_filename = 'mocap_22_cut';

// テスト用
// fs.readFile('../datas/test_datas/kinect_18.csv', 'utf-8', function (err,raw) {

// var file_index = [3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22];

var file_num = process.argv[2].toString();

var input_filename = "mocap_" + file_num + ".csv"
console.log(input_filename);
fs.readFile('../datas/converted_norot_dataset/' + input_filename, 'utf-8', function (err,raw) {
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

        // for(var k = 0; k < euler_i.length - 1; k++){
        frame_array.push(tmp_arr);
        // }

        tmp_arr = [];
      } else {
        tmp_arr.push(parseFloat(data[j][i]));
      }
    }
    var frame_position_array = convert_kinectQuaternion_to_kinectPosition( frame_array );

    converted_data.push(frame_position_array);
  }

  exportcsv(converted_data, input_filename);
  return;
});



// kinect -> three の変換メソッド
function convert_kinectQuaternion_to_kinectPosition( quaternionArray ) {

  var norot = new THREE.Quaternion().set(0,0,0,0); // SL
  var erot = new THREE.Quaternion().set(0,0,0,1); // SL
  var  yrot = new THREE.Quaternion().set(0,0.707,0,0.707);
  var _yrot = new THREE.Quaternion().set(0,-0.707,0,0.707);

  // // (1) 25関節分のquaternionに分け、文字列をfloatに変換する
  var kinectAbs_rotq = new Array(25);
  var tmp = new Array(25);
  for (var i = 0; i < 25; i++) {
    kinectAbs_rotq[i] = new THREE.Quaternion().fromArray(quaternionArray[i]);
  }


  // 以下、kinect -> three

  // 1. kinect-abs -> three-abs: 座標系変換
  // 全部一緒
  var kinectAbsToThreeAbs_rotq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ"));



  // 配列の定義
  var three_rotq = new Array(25);
  for (var i = 0; i < three_rotq.length; i++) {
    if (!kinectAbs_rotq[i]) continue;
    var tmp_rot = new THREE.Vector3( kinectAbs_rotq[i].x, kinectAbs_rotq[i].y, kinectAbs_rotq[i].z );
    tmp_rot.applyQuaternion( kinectAbsToThreeAbs_rotq );
    three_rotq[i] = new THREE.Quaternion( tmp_rot.x, tmp_rot.y, tmp_rot.z, kinectAbs_rotq[i].w );
  }

  // 2. three_obj -> kinect-obj: オブジェクト変換 e.g. SL: (1,0,0) -> (0,1,0)
  //     &  y軸回り180度を除去
  var threeObjToKinectObj = new Array(25);
  threeObjToKinectObj[0] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ")); // SpineBase
  threeObjToKinectObj[1] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ")); // SpineMid
  threeObjToKinectObj[20] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ")); // SpineShoulder (as ShoulderCenter)
  threeObjToKinectObj[2] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ")); // Neck
  threeObjToKinectObj[3] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, "XYZ")); // Face (as Head)

  threeObjToKinectObj[4] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, Math.PI / 2, "XYZ")); // ShoulderLeft --- 0が入るべき
  threeObjToKinectObj[5] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI + Math.PI / 2, Math.PI / 2, "XYZ")); // ElbowLeft
  threeObjToKinectObj[6] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, Math.PI / 2, "XYZ")); // WristLeft
  threeObjToKinectObj[7] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, Math.PI / 2, "XYZ")); // WristLeft


  threeObjToKinectObj[8] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // ShoulderRight --- 0が入るべき
  threeObjToKinectObj[9] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI - Math.PI / 2, -Math.PI / 2, "XYZ")); // ElbowRight
  threeObjToKinectObj[10] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // WristRight
  threeObjToKinectObj[11] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // WristRight


  threeObjToKinectObj[12] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI, Math.PI / 2, "XYZ")); // HipLeft --- 0が入るべき
  threeObjToKinectObj[13] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI + Math.PI / 2, Math.PI, "XYZ")); // KneeLeft
  threeObjToKinectObj[14] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, Math.PI, "XYZ")); // AnkleLeft
  threeObjToKinectObj[15] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, Math.PI, "XYZ")); // AnkleLeft

  threeObjToKinectObj[16] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // HipRight ---- 0が入るべき
  threeObjToKinectObj[17] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI - Math.PI / 2, -Math.PI, "XYZ")); // KneeRight
  threeObjToKinectObj[18] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, -Math.PI, "XYZ")); // AnkleRight
  threeObjToKinectObj[19] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, -Math.PI, "XYZ")); // AnkleRight

  var three_rotq2 = new Array(25);
  for (var i = 0; i < three_rotq2.length; i++) {
    if (!kinectAbs_rotq[i]) continue;
    if (!threeObjToKinectObj[i]) continue;
    three_rotq2[i] = new THREE.Quaternion().multiplyQuaternions(three_rotq[i], threeObjToKinectObj[i]);
  }

  // 3. three_abs -> three_rel: オブジェクト変換
  var three_rotq3 = new Array(25);
  three_rotq3[0] = new THREE.Quaternion().multiplyQuaternions(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, "XYZ")), three_rotq2[0]);
  three_rotq3[1] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[0].inverse(), three_rotq2[1]); // model-SpineBase
  three_rotq3[2] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[1].inverse(), three_rotq2[20]); //
  three_rotq3[3] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[20].inverse(), three_rotq2[2]);
  if (three_rotq3[3]) {
    // face の座標はないときがある
    three_rotq3[4] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[2].inverse(), three_rotq2[3]); // head
  }
  // three_rotq2[20].inverse();
  three_rotq3[5] = erot; // SL --- 0が入るべき
  // three_rotq3[5] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[20].inverse(), three_rotq2[4]); // SL --- 0が入るべき
  three_rotq3[6] = new THREE.Quaternion().multiplyQuaternions(erot, three_rotq2[5]); // EL
  three_rotq3[7] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[5].inverse(), three_rotq2[6]); // WL
  three_rotq3[8] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[6].inverse(), three_rotq2[7]); // WL
  

  // three_rotq2[20].inverse();
  // shoulderは回らないので( 0, 0, 0, 0 )
  three_rotq3[11] = erot; // SR --- 0が入るべき
  // three_rotq3[11] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[20].inverse(), three_rotq2[8]); // SR --- 0が入るべき
  three_rotq3[12] = new THREE.Quaternion().multiplyQuaternions(erot, three_rotq2[9]); // ER
  three_rotq3[13] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[9].inverse(), three_rotq2[10]); // WR
  three_rotq3[14] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[10].inverse(), three_rotq2[11]); // WR
  
  // three_rotq3[17] = erot; // HL --- 0が入るべき
  three_rotq3[17] = erot; // HL --- 0が入るべき
  // three_rotq3[17] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[12].inverse(), three_rotq2[13] ); // KR
  three_rotq3[18] = new THREE.Quaternion().multiplyQuaternions( erot , three_rotq2[13] ); // KL
  three_rotq3[19] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[13].inverse(), three_rotq2[14] ); // AL
  three_rotq3[20] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[14].inverse(), three_rotq2[15] ); // AL

  // three_rotq3[21] = erot; // HR --- 0が入るべき
  three_rotq3[21] = erot; // HR --- 0が入るべき
  // three_rotq3[22] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[16].inverse(), three_rotq2[17] ); // KR
  three_rotq3[22] = new THREE.Quaternion().multiplyQuaternions( erot, three_rotq2[17] ); // KR
  three_rotq3[23] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[17].inverse(), three_rotq2[18] ); // AR
  three_rotq3[24] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[18].inverse(), three_rotq2[19] ); // AR

  // 変換式=================
  var t2_1  = new THREE.Quaternion().multiplyQuaternions(  three_rotq3[0], three_rotq3[1] );
  var t2_20 = new THREE.Quaternion().multiplyQuaternions(  t2_1, three_rotq3[2] );
  var t2_2  = new THREE.Quaternion().multiplyQuaternions( t2_20, three_rotq3[3] );

  // left_hand
  var t2_5  = new THREE.Quaternion().multiplyQuaternions( t2_20, three_rotq3[5]);
  var t2_6  = new THREE.Quaternion().multiplyQuaternions(  t2_5, three_rotq3[6] );
  var t2_7  = new THREE.Quaternion().multiplyQuaternions(  t2_6, three_rotq3[7] );

  // right_hand
  var t2_9  = new THREE.Quaternion().multiplyQuaternions( t2_20, three_rotq3[11] ); 
  var t2_10  = new THREE.Quaternion().multiplyQuaternions( t2_9, three_rotq3[12] ); 
  var t2_11  = new THREE.Quaternion().multiplyQuaternions( t2_10, three_rotq3[13] ); 

  // left_leg
  var t2_13 = new THREE.Quaternion().multiplyQuaternions( three_rotq3[0], three_rotq3[17] );
  var t2_14 = new THREE.Quaternion().multiplyQuaternions( t2_13, three_rotq3[18] );
  var t2_15 = new THREE.Quaternion().multiplyQuaternions( t2_14, three_rotq3[19] );

  // var t2_16 = new THREE.Quaternion().multiplyQuaternions( three_rotq3[0], three_rotq3[21] );
  var t2_17 = new THREE.Quaternion().multiplyQuaternions( three_rotq3[0], three_rotq3[21] );
  var t2_18 = new THREE.Quaternion().multiplyQuaternions( t2_17, three_rotq3[22] );
  var t2_19 = new THREE.Quaternion().multiplyQuaternions( t2_18, three_rotq3[23] );

  var t2_21 = new THREE.Quaternion().multiplyQuaternions( t2_7, erot );
  var t2_22 = new THREE.Quaternion().multiplyQuaternions( t2_7, erot );

  var t2_23 = new THREE.Quaternion().multiplyQuaternions( t2_11, erot );
  var t2_24 = new THREE.Quaternion().multiplyQuaternions( t2_11, erot );

  var converted_position = new Array(25);
  converted_position[0] = new THREE.Vector3().fromArray([0, 0, 0]);
  converted_position[1] = new THREE.Vector3().fromArray(kinect_format_bone_length[1]).applyQuaternion(three_rotq3[0]);

  // ok -- 2
  converted_position[20] = new THREE.Vector3().fromArray(kinect_format_bone_length[20]).applyQuaternion(t2_1);
  converted_position[20].add(converted_position[1]);

  // ok spine_mid --3
  converted_position[2] = new THREE.Vector3().fromArray(kinect_format_bone_length[2]).applyQuaternion(t2_20);
  converted_position[2].add(converted_position[20]);

  // ok neck -- 4
  converted_position[3] = new THREE.Vector3().fromArray(kinect_format_bone_length[3]).applyQuaternion(t2_2);
  converted_position[3].add(converted_position[2]);

  // ok shoulder_left -- 5
  converted_position[4] = converted_position[2];

  // ok elbow -- 6
  converted_position[5] = new THREE.Vector3().fromArray(kinect_format_bone_length[5]).applyQuaternion(t2_5);
  converted_position[5].add(converted_position[4]);

  // ok wrist -- 7
  converted_position[6] = new THREE.Vector3().fromArray(kinect_format_bone_length[6]).applyQuaternion(t2_6);
  converted_position[6].add(converted_position[5]);

  // ok hand -- 8
  converted_position[7] = new THREE.Vector3().fromArray(kinect_format_bone_length[7]).applyQuaternion(t2_7);
  converted_position[7].add(converted_position[6]);

  // ok shoulder_right -- 11
  converted_position[8] = converted_position[2];

  // ok elbow
  converted_position[9] = new THREE.Vector3().fromArray(kinect_format_bone_length[9]).applyQuaternion(t2_9);
  converted_position[9].add(converted_position[8]);

  // ok wrist
  converted_position[10] = new THREE.Vector3().fromArray(kinect_format_bone_length[10]).applyQuaternion(t2_10);
  converted_position[10].add(converted_position[9]);

  // ok hand
  converted_position[11] = new THREE.Vector3().fromArray(kinect_format_bone_length[11]).applyQuaternion(t2_11);
  converted_position[11].add(converted_position[10]);

  // ok hip_left
  converted_position[12] = converted_position[1];

  // ok knee_left
  converted_position[13] = new THREE.Vector3().fromArray(kinect_format_bone_length[13]).applyQuaternion(t2_13);
  converted_position[13].add(converted_position[12]);

  // ok ankle_left
  converted_position[14] = new THREE.Vector3().fromArray(kinect_format_bone_length[14]).applyQuaternion(t2_14);
  converted_position[14].add(converted_position[13]);

  // ok foot
  converted_position[15] = new THREE.Vector3().fromArray(kinect_format_bone_length[15]).applyQuaternion(t2_15);
  converted_position[15].add(converted_position[14]);

  // ok hip_right -- 21
  converted_position[16] = converted_position[1];

  // ok knee_right -- 22
  converted_position[17] = new THREE.Vector3().fromArray(kinect_format_bone_length[17]).applyQuaternion(t2_17);
  converted_position[17].add(converted_position[16]);

  // ok ankle_right -- 23
  converted_position[18] = new THREE.Vector3().fromArray(kinect_format_bone_length[18]).applyQuaternion(t2_18);
  converted_position[18].add(converted_position[17]);

  // ok ankle_right -- 24
  converted_position[19] = new THREE.Vector3().fromArray(kinect_format_bone_length[19]).applyQuaternion(t2_19);
  converted_position[19].add(converted_position[18]);

  // ok thumb_left
  converted_position[21] = new THREE.Vector3().fromArray(kinect_format_bone_length[21]).applyQuaternion(t2_21);
  converted_position[21].add(converted_position[ 7 ]);

  // ok hand_tip_left
  converted_position[22] = new THREE.Vector3().fromArray(kinect_format_bone_length[22]).applyQuaternion(t2_22);
  converted_position[22].add(converted_position[ 7 ]);

  // ok thumb_right
  converted_position[23] = new THREE.Vector3().fromArray(kinect_format_bone_length[23]).applyQuaternion(t2_23);
  converted_position[23].add(converted_position[11]);

  // ok hand_tip_right
  converted_position[24] = new THREE.Vector3().fromArray(kinect_format_bone_length[24]).applyQuaternion(t2_24);
  converted_position[24].add(converted_position[11]);

  // ============
  var frame_position_array = [];
  for (var i = 0; i < 25; i++) {
    converted_position[i] = converted_position[i].toArray();
    for (var j = 0; j < 3; j++) {
      // console.log(converted_position[i][j]);
      frame_position_array.push(converted_position[i][j]);
    }
  }
  return frame_position_array;
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
  output_path = '../datas/converted_norot_dataset/position/corrects/' + output_filename;
  console.log(output_path);
  fs.writeFile( output_path, finalVal, 'utf8', function (err) {
    if (err) {
        console.log('Some error occured - file either not saved or corrupted file saved.');
      } else{
          console.log('It\'s saved!');
        }
  });
}
 
