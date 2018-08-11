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

// var load_filename = 'mocap-2017-0706-0538_formatted';
var load_filename = 'mocap_22_cut';

// fs.readFile('../datas/outputs/' + load_filename + '.csv', 'utf-8', function (err,raw) {
fs.readFile("../datas/raw_datas/experiment/dataset/mo_cross_arms_front_cut.csv", 'utf-8', function (err,raw) {
  if (err) {
    return console.log(err);
  }
  // data ... mocap_ref（生データ）
  data = raw.split(/\r\n|\r|\n/);
  var mocap_ref = new Array(data.length-1);
  var kinect_output_data = new Array(data.length-1);
  var kinect_csv = new Array(data.length-1);
  for (i = 0; i < data.length-1; i++) {
    data[i] = data[i].split(',');

    mocap_ref[i] = data[i].chunk(4);
    for (var j = 0; j < mocap_ref[i].length; j++) {
      mocap_ref[i][j] = new THREE.Quaternion().fromArray(mocap_ref[i][j]);
    }
    // if( count_val==0 ){
    //   console.log(mocap_ref);
    //   count_val++;
    // }
    //
    if( count_val==0 ){
      console.log(mocap_ref);
      console.log('+++++++++++++++++++++++++');
    }
   var mocap_abs = new Array(25);
    var norot = new THREE.Quaternion().set( 0, 0, 0, 0 );
    var erot = new THREE.Quaternion().set( 0, 0, 0, 1 );
    
    mocap_abs[0] = new THREE.Quaternion().multiplyQuaternions(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, "XYZ")), mocap_ref[i][0]);
    mocap_abs[1] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[0], mocap_ref[i][1]);   // SpineMid  
    mocap_abs[20] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[1], mocap_ref[i][2]); // SpineShoulder
    mocap_abs[2] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[20], mocap_ref[i][3]);  // Neck
    if(mocap_abs[2]){
      mocap_abs[3] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[2], mocap_ref[i][4]);   // Head
    }

    // mocap_abs[4] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[20].inverse(), mocap_ref[i][5]); // Shoulder Left
    mocap_abs[4] = erot; // Shoulder Left
    mocap_abs[5] = new THREE.Quaternion().multiplyQuaternions(erot, mocap_ref[i][6]);            // Elbow Left
    mocap_abs[6] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[5], mocap_ref[i][7]);            // Wrist Left
    mocap_abs[7] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[6], mocap_ref[i][8]);            // Wrist Left
    
    // mocap_abs[20].inverse();
    // mocap_abs[8] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[20].inverse(), mocap_ref[i][9]); // Shoulder Right
    mocap_abs[8] = erot; // Shoulder Right
    mocap_abs[9] = new THREE.Quaternion().multiplyQuaternions(erot, mocap_ref[i][12]);            // Elbow Right
    mocap_abs[10] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[9], mocap_ref[i][13]);           // Wrist Right
    mocap_abs[11] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[10], mocap_ref[i][14]);           // Wrist Right

    mocap_abs[12] = erot;  // Hip Left
    mocap_abs[13] = new THREE.Quaternion().multiplyQuaternions(erot, mocap_ref[i][18]); // Knee Left
    mocap_abs[14] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[13], mocap_ref[i][19]); // Ankle Left
    mocap_abs[15] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[14], mocap_ref[i][20]); // Ankle Left

    mocap_abs[16] = erot;  // Hip Right
    mocap_abs[17] = new THREE.Quaternion().multiplyQuaternions(erot, mocap_ref[i][22]); // Knee Right
    mocap_abs[18] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[17], mocap_ref[i][23]); // Ankle Right
    mocap_abs[19] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[18], mocap_ref[i][24]); // Ankle Right
   
    // mocap_abs[12] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[0], mocap_ref[i][12]);  // Hip Left
    // mocap_abs[13] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[12], mocap_ref[i][13]); // Knee Left
    // mocap_abs[14] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[13], mocap_ref[i][14]); // Ankle Left
    //
    // mocap_abs[16] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[0], mocap_ref[i][16]);  // Hip Right
    // mocap_abs[17] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[16], mocap_ref[i][17]); // Knee Right
    // mocap_abs[18] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[17], mocap_ref[i][18]); // Ankle Right
    if( count_val==0 ){
      console.log(mocap_abs);
      count_val++;
    }




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
    kinectAbs_rotq[16] = new THREE.Quaternion(0, 0, 0, 0);
    kinect_output_data[i] = kinectAbs_rotq;
    kinect_csv[i] = [''];
    for (var j = 0; j < kinect_output_data[i].length; j++) {
      kinect_csv[i].push(kinect_output_data[i][j].x, kinect_output_data[i][j].y, kinect_output_data[i][j].z, kinect_output_data[i][j].w);      
    }
    kinect_csv[i].shift();
  }
  exportcsv(kinect_csv);
  return;
});

// 配列をcsvで保存するfunction
function exportcsv(content){
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
  // outputfile_name = '../datas/converted_data/' + load_filename + '_converted.csv'
  outputfile_name = '../datas/raw_datas/experiment/dataset/mo_cross_arms_front.csv'
  console.log(outputfile_name);
  fs.writeFile( outputfile_name, finalVal, 'utf8', function (err) {
    if (err) {
        console.log('Some error occured - file either not saved or corrupted file saved.');
      } else{
          console.log('It\'s saved!');
        }
  });
}
 
