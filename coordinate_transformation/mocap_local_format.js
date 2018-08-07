const fs = require('fs');
const THREE = require('three');
const csvSync = require('./node_modules/csv-parse/lib/sync');


// 1. 不要な部分をカット
// 2. 配列をcsvで保存するfunction
function formatToKienct(content, output_filename){
  var formatCSV = '';

  for (var frame = 0; frame < content.length; frame++) {

    // 不要なヘッダーの削除（0~6行目の削除）
    if( frame > 6 ){
      var value = content[frame];
      // 不要な( timeframe, time ）を削除
      value.splice(0, 2)

      for (var index = 0; index < value.length; index++) {
        var innerValue = value[index]===null?'':value[index].toString();
        var result = innerValue.replace(/"/g, '""');

        if (result.search(/("|,|\n)/g) >= 0)
          result = '"' + result + '"';
        
        if (index > 0)
        formatCSV += ',';
        formatCSV += result;
      }
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
  }

  // 3. 配列化
  var all_data = [];
  for (var frame = 0; frame < comma_split.length; frame++) {
    var _skeleton_data = [];
    var _bone_data = [];
    var _is_checked_hip = 0;
    for (var index = 0; index < comma_split[frame].length; index++) {
      // 1. hipだけ[x, y, z, w] + [x, y, z]が格納されている
      if( _is_checked_hip == 0 ){
        if( _bone_data.length == 6 ){
          _bone_data.push( comma_split[frame][index] );
          _bone_data.splice(4, 3);
          _skeleton_data.push( _bone_data );
          _is_checked_hip = 1;
          _bone_data = [];
        } else {
          _bone_data.push(comma_split[frame][index]);
        }
      } else {
        if( _bone_data.length == 3 ){
          _bone_data.push( comma_split[frame][index] );
          _skeleton_data.push(_bone_data);
          _bone_data = [];
        } else {
          _bone_data.push(comma_split[frame][index]);  
        }
      }
    }
    all_data.push(_skeleton_data);
  }

  // 4. 必要なデータの抜き出し
  var mocap_ref = new Array( all_data.length );
  for (var frame = 0; frame < all_data.length - 1; frame++) {
    mocap_ref[frame] = [
      new THREE.Quaternion().fromArray( all_data[frame][0] ),
      new THREE.Quaternion().fromArray( all_data[frame][1] ), // spine_mid
      new THREE.Quaternion().fromArray( all_data[frame][2] ),  // spine_shoulder 20
      new THREE.Quaternion().fromArray( all_data[frame][3] ), // neck
      new THREE.Quaternion().fromArray( all_data[frame][4] ), // head
 
      new THREE.Quaternion().fromArray( [0, 0, 0, 1] ), //5
      new THREE.Quaternion().fromArray( all_data[frame][6] ), // shoulder_left
      new THREE.Quaternion().fromArray( all_data[frame][7] ), // elbow_left
      new THREE.Quaternion().fromArray( all_data[frame][8] ), // wrist_left
      // all_data[frame][8] // hand_left

      new THREE.Quaternion().fromArray( [0, 0, 0, 1] ), //9
      new THREE.Quaternion().fromArray( [0, 0, 0, 1] ), //10

      new THREE.Quaternion().fromArray( [0, 0, 0, 1] ), //11
      new THREE.Quaternion().fromArray( all_data[frame][10] ),  // shoulder_right
      new THREE.Quaternion().fromArray( all_data[frame][11] ), // elbow_right
      new THREE.Quaternion().fromArray( all_data[frame][12] ), // wrist

      new THREE.Quaternion().fromArray( [0, 0, 0, 1] ), //15
      new THREE.Quaternion().fromArray( [0, 0, 0, 1] ), //16
     
      new THREE.Quaternion().fromArray( [0, 0, 0, 1] ), //17
      new THREE.Quaternion().fromArray( all_data[frame][13] ), // hip_left
      new THREE.Quaternion().fromArray( all_data[frame][14] ), // knee_left
      new THREE.Quaternion().fromArray( all_data[frame][15] ), // ankle_left

      // コメントアウト, 元コード
      new THREE.Quaternion().fromArray( [0, 0, 0, 1] ), //21
      new THREE.Quaternion().fromArray( all_data[frame][16] ), // hip
      new THREE.Quaternion().fromArray( all_data[frame][17] ), // knee
      new THREE.Quaternion().fromArray( all_data[frame][18] ) // ankle
    ];
  }

  // 5. three_jsに変換
  var kinect_csv = new Array( mocap_ref.length - 1 );
  for (var frame = 0; frame < mocap_ref.length - 1; frame++) {
    var mocap_abs = new Array(25);
    var kinect_output_frame_data = [];
    var norot = new THREE.Quaternion().set( 0, 0, 0, 0 );
    var erot = new THREE.Quaternion().set( 0, 0, 0, 1 );
    
    mocap_abs[0] = new THREE.Quaternion().multiplyQuaternions(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, "XYZ")), mocap_ref[frame][0]);
    mocap_abs[1] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[0], mocap_ref[frame][1]);   // SpineMid  
    mocap_abs[20] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[1], mocap_ref[frame][2]); // SpineShoulder
    mocap_abs[2] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[20], mocap_ref[frame][3]);  // Neck
    if(mocap_abs[2]){
      mocap_abs[3] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[2], mocap_ref[frame][4]);   // Head
    }

    // mocap_abs[4] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[20].inverse(), mocap_ref[frame][5]); // Shoulder Left
    mocap_abs[4] = erot; // Shoulder Left
    mocap_abs[5] = new THREE.Quaternion().multiplyQuaternions(erot, mocap_ref[frame][6]);            // Elbow Left
    mocap_abs[6] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[5], mocap_ref[frame][7]);            // Wrist Left
    mocap_abs[7] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[6], mocap_ref[frame][8]);            // Wrist Left
    
    // mocap_abs[20].inverse();
    // mocap_abs[8] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[20].inverse(), mocap_ref[frame][9]); // Shoulder Right
    mocap_abs[8] = erot; // Shoulder Right
    mocap_abs[9] = new THREE.Quaternion().multiplyQuaternions(erot, mocap_ref[frame][12]);            // Elbow Right
    mocap_abs[10] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[9], mocap_ref[frame][13]);           // Wrist Right
    mocap_abs[11] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[10], mocap_ref[frame][14]);           // Wrist Right

    mocap_abs[12] = erot;  // Hip Left
    mocap_abs[13] = new THREE.Quaternion().multiplyQuaternions(erot, mocap_ref[frame][18]); // Knee Left
    mocap_abs[14] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[13], mocap_ref[frame][19]); // Ankle Left
    mocap_abs[15] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[14], mocap_ref[frame][20]); // Ankle Left

    mocap_abs[16] = erot;  // Hip Right
    mocap_abs[17] = new THREE.Quaternion().multiplyQuaternions(erot, mocap_ref[frame][22]); // Knee Right
    mocap_abs[18] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[17], mocap_ref[frame][23]); // Ankle Right
    mocap_abs[19] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[18], mocap_ref[frame][24]); // Ankle Right
   

    // (3) mocap to kinect (before flip)
    // mocapの回転座標系をkinectの回転座標系に変換
    // 180°Yflipは次行う
    var mocapToKinectAbs = new Array(25);
    mocapToKinectAbs[0] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ")); // SpineBase
    mocapToKinectAbs[1] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ")); // SpineMid
    mocapToKinectAbs[20] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ")); // SpineShoulder (as ShoulderCenter)
    mocapToKinectAbs[2] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ")); // Neck
    mocapToKinectAbs[3] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, "XYZ")); // Face (as Head)

    mocapToKinectAbs[4] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, Math.PI / 2, "XYZ")); // ShoulderLeft
    mocapToKinectAbs[5] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI + Math.PI / 2, Math.PI / 2, "XYZ")); // ElbowLeft
    mocapToKinectAbs[6] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, Math.PI / 2, "XYZ")); // WristLeft
    mocapToKinectAbs[7] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, Math.PI / 2, "XYZ")); // WristLeft

    mocapToKinectAbs[8] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // ShoulderRight
    mocapToKinectAbs[9] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI - Math.PI / 2, -Math.PI / 2, "XYZ")); // ElbowRight
    mocapToKinectAbs[10] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // WristRight
    mocapToKinectAbs[11] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // WristRight

    mocapToKinectAbs[12] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI, Math.PI / 2, "XYZ")); // HipLeft
    mocapToKinectAbs[13] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI + Math.PI / 2, Math.PI, "XYZ")); // KneeLeft
    mocapToKinectAbs[14] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, Math.PI, "XYZ")); // AnkleLeft
    mocapToKinectAbs[15] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, Math.PI, "XYZ")); // AnkleLeft

    mocapToKinectAbs[16] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // HipRight
    mocapToKinectAbs[17] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI - Math.PI / 2, -Math.PI, "XYZ")); // KneeRight
    mocapToKinectAbs[18] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, -Math.PI, "XYZ")); // AnkleRight
    mocapToKinectAbs[19] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, -Math.PI, "XYZ")); // AnkleRight

    var kinectAbs_rotq_preYflip = new Array(25);
    for (var j = 0; j < mocapToKinectAbs.length; j++) {
        if (!mocap_abs[j]) continue;
        kinectAbs_rotq_preYflip[j] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[j], mocapToKinectAbs[j].inverse());
        // console.log(kinectAbs_rotq_preYflip[j]);
    }

    // (4) kinect Y flip (kinectカメラから見て右側が正のため、Y軸を対象に180°回転する必要がある)
    // 全部一緒
    var kinectYflip = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ"));
    var kinectAbs_rotq = new Array(25);
    for (var j = 0; j < kinectAbs_rotq.length; j++) {
        if (kinectAbs_rotq_preYflip[j]){
            var tmp_rot = new THREE.Vector3(kinectAbs_rotq_preYflip[j].x, kinectAbs_rotq_preYflip[j].y, kinectAbs_rotq_preYflip[j].z);
            tmp_rot.applyQuaternion(kinectYflip);
            kinectAbs_rotq[j] = new THREE.Quaternion(tmp_rot.x, tmp_rot.y, tmp_rot.z, kinectAbs_rotq_preYflip[j].w);
        } else {
            kinectAbs_rotq[j] = new THREE.Quaternion(0, 0, 0, 0);
        }
    }
    kinectAbs_rotq[4] = new THREE.Quaternion(0, 0, 0, 1);
    kinectAbs_rotq[8] = new THREE.Quaternion(0, 0, 0, 1);
    kinectAbs_rotq[12] = new THREE.Quaternion(0, 0, 0, 0);
    kinectAbs_rotq[15] = new THREE.Quaternion(0, 0, 0, 0);
    kinectAbs_rotq[16] = new THREE.Quaternion(0, 0, 0, 0);
    kinectAbs_rotq[19] = new THREE.Quaternion(0, 0, 0, 0);
    kinect_output_frame_data[frame] = kinectAbs_rotq;
    kinect_csv[frame] = [''];
    for (var j = 0; j < kinect_output_frame_data[frame].length; j++) {
      kinect_csv[frame].push(kinect_output_frame_data[frame][j].x, kinect_output_frame_data[frame][j].y, kinect_output_frame_data[frame][j].z, kinect_output_frame_data[frame][j].w);      
    }
    kinect_csv[frame].shift();
  }
  // console.log( kinect_csv[0] );
  exportcsv(kinect_csv, output_filename);
}

// 配列をcsvで保存するfunction
function exportcsv(content, output_filename){
  var finalVal = '';
  var fs = require('fs');

  // console.log( content );
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
  // outputfile_name = '../datas/converted_data/' + load_filename + '_converted.csv'
  outputfile_name = output_filename
  console.log(outputfile_name);
  fs.writeFile( outputfile_name, finalVal, 'utf8', function (err) {
    if (err) {
        console.log('Some error occured - file either not saved or corrupted file saved.');
      } else{
          console.log('It\'s saved!');
        }
  });
}

function main(){
  var data_path = "../datas/raw_datas/experiment/";
  // var input_filename = process.argv[2];
  // var output_filename = process.argv[3];

  fs.readdir(data_path, function(err, files){
    if (err) throw err;
    console.log(files);
    files.forEach( function(file){

      mocap_flag = new RegExp( "mo_nod");

      if (file.match( mocap_flag )) {
        console.log( file );
        // csvの読み込み、パース

        var input_filename = data_path + file;
        var output_filename = "../datas/raw_datas/experiment/dataset/" + file;
        let raw_data = fs.readFileSync(input_filename);
        let contents = csvSync(raw_data);

        formatToKienct(contents, output_filename);
      }
    });
  });


}



main();