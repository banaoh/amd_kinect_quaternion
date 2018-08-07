/**
 * Created by daiha_000 on 2015/10/29.
 */

// global variable
var mesh; //モデルデータ
var webglcanvas = document.getElementById("webgl-container");

var webglcamera;
var light;
var loader;
var webglwidth = 640;
var webglheight = 480;
var webGLRenderer;
var spotlight;

var count = 0;
var current_frame = 0;
var end_frame = 0;

var model_num = 2;

var motion_data = new Array(model_num);
var mesh = new Array(model_num);

// preparing vivi[] and vuvu[]
var vivi = [];
var vuvu = [];

function boneinvert() {
  var Xaxis = new THREE.Vector3(1, 0, 0);
  var Yaxis = new THREE.Vector3(0, 1, 0);
  var Zaxis = new THREE.Vector3(0, 0, 1);
  var angle = -Math.PI / 2;

  for (var i = 0; i < 20; i++) {
    vivi[i] = new THREE.Quaternion();
    vuvu[i] = new THREE.Quaternion();
  }

  vivi[0].setFromAxisAngle(Yaxis, Math.PI);
  vivi[4].setFromAxisAngle(Zaxis, -angle);
  vivi[8].setFromAxisAngle(Zaxis, angle);
  vivi[12].setFromAxisAngle(Zaxis, -angle);
  vivi[13].setFromAxisAngle(Zaxis, -angle);
  vivi[15].setFromAxisAngle(Xaxis, -angle);
  vivi[16].setFromAxisAngle(Zaxis, angle);
  vivi[17].setFromAxisAngle(Zaxis, angle);
  vivi[19].setFromAxisAngle(Xaxis, -angle);
  vuvu[0].setFromAxisAngle(Yaxis, Math.PI);
  vuvu[5].setFromAxisAngle(Zaxis, angle);
  vuvu[6].setFromAxisAngle(Zaxis, angle);
  vuvu[7].setFromAxisAngle(Zaxis, angle);
  vuvu[9].setFromAxisAngle(Zaxis, -angle);
  vuvu[10].setFromAxisAngle(Zaxis, -angle);
  vuvu[11].setFromAxisAngle(Zaxis, -angle);
  vuvu[13].setFromAxisAngle(Zaxis, angle);
  vuvu[14].setFromAxisAngle(Zaxis, angle * 2);
  vuvu[15].setFromAxisAngle(Zaxis, angle * 2);
  vuvu[17].setFromAxisAngle(Zaxis, -angle);
  vuvu[18].setFromAxisAngle(Zaxis, -angle * 2);
  vuvu[19].setFromAxisAngle(Zaxis, -angle * 2);
}

boneinvert();


// webgl settings
//renderer
webglrenderer = new THREE.WebGLRenderer({ antialias: true });
webglrenderer.setClearColor(new THREE.Color(0xFFFFFF, 0));
webglrenderer.setSize(webglwidth, webglheight);
webglrenderer.shadowMapEnabled = true;
webglrenderer.shadowMapType = THREE.PCFSoftShadowMap;
webglcanvas.appendChild(webglrenderer.domElement);

//scene
scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xfff4e5, 0.00003);

//helper
scene.add(new THREE.AxisHelper(30));

//camera
webglcamera = new THREE.PerspectiveCamera(40, webglwidth / webglheight, 1, 12000);
webglcamera.position.set(0, 5, 30);
webglcamera.lookAt(new THREE.Vector3(0, 30, 0));


// トラックボールの作成
trackball = new THREE.TrackballControls(webglcamera);
// 回転無効化と回転速度の設定
trackball.noRotate = false; // false:有効 true:無効
trackball.rotateSpeed = 5.0;
// ズーム無効化とズーム速度の設定
trackball.noZoom = false; // false:有効 true:無効
trackball.zoomSpeed = 1.0;
// パン無効化とパン速度の設定
trackball.noPan = false; // false:有効 true:無効
trackball.panSpeed = 1.0;
// スタティックムーブの有効化
trackball.staticMoving = true; // true:スタティックムーブ false:ダイナミックムーブ
// ダイナミックムーブ時の減衰定数
trackball.dynamicDampingFactor = 0.3;


//light
var spotlight = new Array(3);
for (var i = 0; i < 3; i++) {
  spotlight[i] = new THREE.SpotLight(0xffffff);
  spotlight[i].angle = Math.PI / 3;
  spotlight[i].castShadow = true;
  spotlight[i].shadowMapWidth = 2048;
  spotlight[i].shadowMapHeight = 2048;
  spotlight[i].shadowBias = 0.0001;
  spotlight[i].shadowDarkness = 0.8;
  spotlight[i].shadowCameraNear = 10;
  spotlight[i].shadowCameraFar = 1000;
  spotlight[i].shadowCameraFov = 90;
  spotlight[i].position.set(i*300-300, 0, 100);
  spotlight[i].intensity = 1.5;
  scene.add(spotlight[i]);
}


// model rendering
loader = new THREE.JSONLoader();
loader.load("model/50s_politician4v2.js", function(geometry, mats) {
// loader.load("model/test_p.js", function(geometry, mats) {
// loader.load("model/test_b.js", function(geometry, mats) {
// loader.load("model/kinect_banaoh.js", function(geometry, mats) {
// loader.load("model/test_b2.js", function(geometry, mats) {
// loader.load("model/test_k2.js", function(geometry, mats) {
// loader.load("model/test_k3.js", function(geometry, mats) {
// loader.load("model/kinect_v2_banaoh_bone.json", function(geometry, mats) {
// loader.load("model/kinect_v2_banaoh_bone.js", function(geometry, mats) {


  mats.forEach(function(mat) {
    mat.skinning = true;
    //mat.morphTargets = true;
  });

  // (1) csvデータの読み込み
  // motion_data[0, 1, 2] ... [ original(kinect), predicted, correct(mocap) ]
  var filename = new Array(model_num);

  // mocap動作確認用
  // filename[0] = "../datas/outputs/t_450-1000.csv";
  // filename[1] = "../datas/outputs/t_5050-5333.csv";
  // filename[2] = "../datas/outputs/t_2000-2400.csv";

  // filename[0] = "../datas/outputs/t_full_data.csv";
  // filename[1] = "../datas/converted_data/t_full_data_converted.csv";
  // filename[2] = "../datas/outputs/kinect-2017-0706-0538-formatted.csv";

  // フレームを合わせ用
  // var filenum = "06";
  // filename[0] = "../datas/outputs/kinect_03_formatted.csv";
  // filename[1] = "../datas/outputs/kinect_" + filenum + "_formatted.csv";
  // filename[2] = "../datas/outputs/mocap_" + filenum + "_cut.csv";
  
  // 変換確認用
  var filenum = "18";
  // filename[0] = "../datas/outputs/kinect_" + filenum + "_formatted.csv";
  // filename[0] = "../datas/check/kinect_" + filenum + "_formatted.csv";
  // filename[1] = "../datas/check/mocap_" + filenum + "_cut_converted.csv";

  var motion = "walking";
  // var front = "front";
  // var back = "back";
  var side = "front";

  filename[0] = "../datas/raw_datas/experiment/dataset/ki_" + motion + "_" + side + ".csv";
  filename[1] = "../datas/raw_datas/experiment/dataset/mo_" + motion + "_" + side + ".csv";

  // filename[0] = "../datas/converted_norot_dataset/kinect_17.csv";
  // filename[1] = "../datas/converted_norot_dataset/mocap_17.csv";

  filename[0] = "../datas/raw_datas/experiment/dataset/predicts/ki_" + motion + "_" + side + ".csv";
  filename[1] = "../datas/raw_datas/experiment/dataset/predicts/mo_" + motion + "_" + side + ".csv";


  // filename[2] = "../datas/raw_datas/experiment/dataset/ki_" + motion + "_" + back + ".csv";
  // filename[3] = "../datas/raw_datas/experiment/dataset/mo_" + motion + "_" + back + ".csv";
  // filename[4] = "../datas/raw_datas/experiment/dataset/ki_" + motion + "_" + side + ".csv";
  // filename[5] = "../datas/raw_datas/experiment/dataset/mo_" + motion + "_" + side + ".csv";



  // (2) motionデータの読み込み
  for (var i = 0; i < motion_data.length; i++) {
    motion_data[i] = load_csv(filename[i]);
  }
  

  // (3) frameの長さを合わせる
  var min_frame = motion_data[0].length;
  for (var i = 1; i < motion_data.length; i++) {
    if(min_frame > motion_data[i].length){
      min_frame = motion_data[i].length;
    }
  }
  for (var i = 0; i < motion_data.length; i++) {
    motion_data[i] = motion_data[i].slice(0, min_frame);
  }
  end_frame = min_frame;

  // (4) meshの準備
  // mesh[0, 1, 2] ... [ original(kinect), predicted, correct(mocap) ]
  for (var i = 0; i < mesh.length; i++) {
    mesh[i] = new THREE.SkinnedMesh(geometry, new THREE.MeshFaceMaterial(mats));
    // mesh[i].skeleton.bones[0].position.set(i*15-20, 0, 0);
    mesh[i].skeleton.bones[0].position.set(i*10-5, 0, 0);
    // mesh[i].scale.set(5.8, 5.8, 5.8);
    mesh[i].scale.set(1, 1, 1);
    mesh[i].castShadow = true;
    scene.add(mesh[i]);
  }


  
  render();
});

// csvファイルを読み込み、配列にして返す
// return motion[frame][ 25関節 x quaternion(x, y, z, w) ]
function load_csv(filename){
  var csvData = new Array();
  var data = new XMLHttpRequest();
  data.open("GET", filename, false); //true:非同期,false:同期
  data.send(null);

  var LF = String.fromCharCode(10); //改行ｺｰﾄﾞ
  var lines = data.responseText.split(LF);
  for (var i = 0; i < lines.length;++i) {
    var cells = lines[i].split(",");
    if( cells.length != 1 ) {
      csvData.push(cells);
    }
  }
  return csvData;
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// kinect -> three の変換メソッド
function convert_kinect_to_three( quaternionArray, mesh ) {

  var norot = new THREE.Quaternion().set(0,0,0,0); // SL
  var erot = new THREE.Quaternion().set(0,0,0,1); // SL
  var  yrot = new THREE.Quaternion().set(0,0.707,0,0.707);
  var _yrot = new THREE.Quaternion().set(0,-0.707,0,0.707);

  // // (1) 25関節分のquaternionに分け、文字列をfloatに変換する
  var kinectAbs_rotq = new Array(25);
  var tmp = new Array(25);
  for (var i = 0; i < quaternionArray.length/4; i++) {
    kinectAbs_rotq[i] = new THREE.Quaternion().set( parseFloat(quaternionArray[i*4]),
                                                    parseFloat(quaternionArray[i*4+1]),
                                                    parseFloat(quaternionArray[i*4+2]),
                                                    parseFloat(quaternionArray[i*4+3]));
  }
  // kinectAbs_rotq[4] = new THREE.Quaternion().set(0,0,0,0);
  // kinectAbs_rotq[8] = new THREE.Quaternion().set(0,0,0,0);
  // kinectAbs_rotq[12] = new THREE.Quaternion().set(0,0,0,0);
  // kinectAbs_rotq[16] = new THREE.Quaternion().set(0,0,0,0);i
  // kinectAbs_rotq[4] = kinectAbs_rotq[8] = erot;


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
  

  // three_rotq3[17] = new THREE.Quaternion( 0, 0, 0, 1 ); // HL

  // three_rotq2[12] = new THREE.Quaternion().set(0,0,0,1);
  
  // three_rotq3[17] = erot; // HL --- 0が入るべき
  three_rotq3[17] = erot; // HL --- 0が入るべき
  // three_rotq3[17] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[12].inverse(), three_rotq2[13] ); // KR
  three_rotq3[18] = new THREE.Quaternion().multiplyQuaternions( erot , three_rotq2[13] ); // KL
  three_rotq3[19] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[13].inverse(), three_rotq2[14] ); // AL
  three_rotq3[20] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[14].inverse(), three_rotq2[15] ); // AL

  // three_rotq3[21] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[0].inverse(),  three_rotq2[16] ); // HR


  // three_rotq3[21] = new THREE.Quaternion( 0, 0, 0, 1 ); // HR

  // three_rotq2[16] = new THREE.Quaternion().set(0,0,0,1);
  
  // three_rotq3[21] = erot; // HR --- 0が入るべき
  three_rotq3[21] = erot; // HR --- 0が入るべき
  // three_rotq3[22] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[16].inverse(), three_rotq2[17] ); // KR
  three_rotq3[22] = new THREE.Quaternion().multiplyQuaternions( erot, three_rotq2[17] ); // KR
  three_rotq3[23] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[17].inverse(), three_rotq2[18] ); // AR
  three_rotq3[24] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[18].inverse(), three_rotq2[19] ); // AR



  // console.log("three_rotq3");
  // console.log(three_rotq3);

  // console.log(erot.inverse());


  for (var j = 0; j < 25; j++) {
      mesh.skeleton.bones[j].quaternion.copy( norot );
  }

  mesh.skeleton.bones[0].quaternion.copy( three_rotq3[0] );
  mesh.skeleton.bones[1].quaternion.copy( three_rotq3[1] );
  mesh.skeleton.bones[2].quaternion.copy( three_rotq3[2] );
  mesh.skeleton.bones[3].quaternion.copy( three_rotq3[3] );
  if(three_rotq3[4]){
    mesh.skeleton.bones[4].quaternion.copy( three_rotq3[4] );
  }

  mesh.skeleton.bones[5].quaternion.copy( three_rotq3[5] ); // 0であるべき
  mesh.skeleton.bones[6].quaternion.copy( three_rotq3[6] ); // 肩の回転が入っている
  mesh.skeleton.bones[7].quaternion.copy( three_rotq3[7] ); // 肘の回転が入っているべき
  // 手首の回転を入れる

  mesh.skeleton.bones[11].quaternion.copy( three_rotq3[11] ); // 0であるべき
  mesh.skeleton.bones[12].quaternion.copy( three_rotq3[12] );
  mesh.skeleton.bones[13].quaternion.copy( three_rotq3[13] );
  // 手首の回転を入れる

  mesh.skeleton.bones[17].quaternion.copy( three_rotq3[17] ); // 0であるべき
  mesh.skeleton.bones[18].quaternion.copy( three_rotq3[18] );
  mesh.skeleton.bones[19].quaternion.copy( three_rotq3[19] );
  mesh.skeleton.bones[20].quaternion.copy( three_rotq3[20] );

  mesh.skeleton.bones[21].quaternion.copy( three_rotq3[21] ); // 0であるべき
  mesh.skeleton.bones[22].quaternion.copy( three_rotq3[22] );
  mesh.skeleton.bones[23].quaternion.copy( three_rotq3[23] );
  mesh.skeleton.bones[24].quaternion.copy( three_rotq3[24] );


}




// ===================================================================================
// ===================================================================================
// ===================================================================================
// ===================================================================================


// kinect -> three の変換メソッド
function kinect_to_three( quaternionArray, mesh ) {

  // // (1) 25関節分のquaternionに分け、文字列をfloatに変換する
  var kinectAbs_rotq = new Array(25);
  for (var i = 0; i < quaternionArray.length/4; i++) {
    kinectAbs_rotq[i] = new THREE.Quaternion().set( parseFloat(quaternionArray[i*4]),
                                                    parseFloat(quaternionArray[i*4+1]),
                                                    parseFloat(quaternionArray[i*4+2]),
                                                    parseFloat(quaternionArray[i*4+3]));
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

  threeObjToKinectObj[4] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, Math.PI / 2, "XYZ")); // ShoulderLeft
  threeObjToKinectObj[5] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI + Math.PI / 2, Math.PI / 2, "XYZ")); // ElbowLeft
  threeObjToKinectObj[6] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, Math.PI / 2, "XYZ")); // WristLeft


  threeObjToKinectObj[8] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // ShoulderRight
  threeObjToKinectObj[9] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI - Math.PI / 2, -Math.PI / 2, "XYZ")); // ElbowRight
  threeObjToKinectObj[10] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // WristRight


  threeObjToKinectObj[12] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI, Math.PI / 2, "XYZ")); // HipLeft
  threeObjToKinectObj[13] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI + Math.PI / 2, Math.PI, "XYZ")); // KneeLeft
  threeObjToKinectObj[14] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, Math.PI, "XYZ")); // AnkleLeft

  threeObjToKinectObj[16] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // HipRight
  threeObjToKinectObj[17] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI - Math.PI / 2, -Math.PI, "XYZ")); // KneeRight
  threeObjToKinectObj[18] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, -Math.PI, "XYZ")); // AnkleRight

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
  // three_rotq2[4] = new THREE.Quaternion().set(0,0,0,0);
  three_rotq3[5] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[20].inverse(), three_rotq2[4]); // SL
  three_rotq3[6] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[4].inverse(), three_rotq2[5]); // EL
  three_rotq3[7] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[5].inverse(), three_rotq2[6]); // WL

  three_rotq2[20].inverse();
  // shoulderは回らないので( 0, 0, 0, 0 )
  // three_rotq2[8] = new THREE.Quaternion().set(0,0,0,0);
  three_rotq3[11] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[20].inverse(), three_rotq2[8]); // SR
  three_rotq3[12] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[8].inverse(), three_rotq2[9]); // ER
  three_rotq3[13] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[9].inverse(), three_rotq2[10]); // WR

  three_rotq3[17] = new THREE.Quaternion( 0, 0, 0, 1 ); // HL
  three_rotq3[18] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[12].inverse(), three_rotq2[13] ); // KL
  three_rotq3[19] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[13].inverse(), three_rotq2[14] ); // AL

  // three_rotq3[21] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[0].inverse(),  three_rotq2[16] ); // HR
  three_rotq3[21] = new THREE.Quaternion( 0, 0, 0, 1 ); // HR
  three_rotq3[22] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[16].inverse(), three_rotq2[17] ); // KR
  three_rotq3[23] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[17].inverse(), three_rotq2[18] ); // AR


  erot = new THREE.Quaternion().set(0,0,0,1); // SL
  norot = new THREE.Quaternion().set(0,0,0,0); // SL
  yrot = new THREE.Quaternion().set(0,0.707,0,0.707);
  _yrot = new THREE.Quaternion().set(0,-0.707,0,0.707);

  for (var j = 0; j < 25; j++) {
      mesh.skeleton.bones[j].quaternion.copy( norot );
  }

  mesh.skeleton.bones[0].quaternion.copy( three_rotq3[0] );
  mesh.skeleton.bones[1].quaternion.copy( three_rotq3[1] );
  mesh.skeleton.bones[2].quaternion.copy( three_rotq3[2] );
  mesh.skeleton.bones[3].quaternion.copy( three_rotq3[3] );

  mesh.skeleton.bones[5].quaternion.copy( three_rotq3[5] );
  mesh.skeleton.bones[6].quaternion.copy( three_rotq3[6] );
  mesh.skeleton.bones[7].quaternion.copy( three_rotq3[7] );

  mesh.skeleton.bones[11].quaternion.copy( three_rotq3[11] );
  mesh.skeleton.bones[12].quaternion.copy( three_rotq3[12] );
  mesh.skeleton.bones[13].quaternion.copy( three_rotq3[13] );

  mesh.skeleton.bones[17].quaternion.copy( norot );
  // mesh.skeleton.bones[17].quaternion.copy( yrot );
  // mesh.skeleton.bones[17].quaternion.copy( three_rotq3[17] );
  mesh.skeleton.bones[18].quaternion.copy( three_rotq3[18] );
  mesh.skeleton.bones[19].quaternion.copy( three_rotq3[19] );
  mesh.skeleton.bones[20].quaternion.copy( norot );

  mesh.skeleton.bones[21].quaternion.copy( norot );
  // mesh.skeleton.bones[21].quaternion.copy( _yrot );
  // mesh.skeleton.bones[21].quaternion.copy( three_rotq3[21] );
  mesh.skeleton.bones[22].quaternion.copy( three_rotq3[22] );
  mesh.skeleton.bones[23].quaternion.copy( three_rotq3[23] );
  mesh.skeleton.bones[24].quaternion.copy( norot );
}




// kinect -> three の変換メソッド
function mocap_to_three( quaternionArray, mesh ) {

  // // (1) 25関節分のquaternionに分け、文字列をfloatに変換する
  var kinectAbs_rotq = new Array(25);
  for (var i = 0; i < quaternionArray.length/4; i++) {
    kinectAbs_rotq[i] = new THREE.Quaternion().set( parseFloat(quaternionArray[i*4]),
                                                    parseFloat(quaternionArray[i*4+1]),
                                                    parseFloat(quaternionArray[i*4+2]),
                                                    parseFloat(quaternionArray[i*4+3]));
  }
  norot = new THREE.Quaternion().set(0,0,0,0); // SL

  for (var j = 0; j < 25; j++) {
      mesh.skeleton.bones[j].quaternion.copy( kinectAbs_rotq[j] );
  }

}


var mocap_current_frame = 0;
//render
function render() {
  
  // ゆっくり再生させるために、1frameを3倍の時間で再生
  count++;
  if( current_frame < end_frame ){
    if( count % 3 == 0 )
      current_frame++;
  } else {
    current_frame=0;
  }

  
  var kinect_add_frame = 0;
  var  mocap_add_frame = 0;
  var   both_add_frame = 0;

  

  // 変換を確認用
  convert_kinect_to_three( motion_data[0][current_frame + kinect_add_frame + both_add_frame ], mesh[0] );
  convert_kinect_to_three( motion_data[1][current_frame + mocap_add_frame + both_add_frame ], mesh[1] );
  // convert_kinect_to_three( motion_data[2][current_frame + kinect_add_frame + both_add_frame ], mesh[2] );
  // convert_kinect_to_three( motion_data[3][current_frame + mocap_add_frame + both_add_frame ], mesh[3] );
  // convert_kinect_to_three( motion_data[4][current_frame + kinect_add_frame + both_add_frame ], mesh[4] );
  // convert_kinect_to_three( motion_data[5][current_frame + mocap_add_frame + both_add_frame ], mesh[5] );
  // convert_kinect_to_three( motion_data[1][current_frame + kinect_add_frame + both_add_frame ], mesh[1] );
  // convert_kinect_to_three( motion_data[2][mocap_current_frame  + mocap_add_frame + both_add_frame ], mesh[2] );
  // mocap_to_three( motion_data[3][current_frame + mocap_add_frame + both_add_frame ], mesh[3] );
  console.log(current_frame + both_add_frame);


  requestAnimationFrame(render);

  // トラックボールによるカメラのプロパティの更新
  trackball.update();

  // rendering scene from camera
  webglrenderer.render(scene, webglcamera);
}
