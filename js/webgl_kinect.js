/**
 * Created by daiha_000 on 2015/10/29.
 */

// global variable
var mesh; //モデルデータ
var webglcanvas = document.getElementById("webgl-container");
var scene;
var webglcamera;
var light;
var loader;
var webglwidth = 640;
var webglheight = 480;
var webGLRenderer;
var spotlight;

// preparing vivi[] and vuvu[]
var vivi = [];
var vuvu = [];

function boneinvert() {
    var Xaxis = new THREE.Vector3(1, 0, 0);
    var Yaxis = new THREE.Vector3(0, 1, 0);
    var Zaxis = new THREE.Vector3(0, 0, 1);
    var angle = -Math.PI / 2;

    var i;
    for (i = 0; i < 20; i++) {
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
webglcamera = new THREE.PerspectiveCamera(40, webglwidth / webglheight, 1, 1000);
webglcamera.position.set(0, 40, 200);
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
spotlight = new THREE.SpotLight(0xffffff);
spotlight.angle = Math.PI / 3;
spotlight.castShadow = true;
spotlight.shadowMapWidth = 2048;
spotlight.shadowMapHeight = 2048;
spotlight.shadowBias = 0.0001;
spotlight.shadowDarkness = 0.8;
spotlight.shadowCameraNear = 10;
spotlight.shadowCameraFar = 1000;
spotlight.shadowCameraFov = 90;
spotlight.position.set(5, 200, 100);
spotlight.intensity = 1.5;
scene.add(spotlight);

//light2
spotlight2 = new THREE.SpotLight(0xffffff);
spotlight2.angle = Math.PI / 3;
spotlight2.shadowMapWidth = 2048;
spotlight2.shadowMapHeight = 2048;
spotlight2.shadowBias = 0.0001;
spotlight2.shadowDarkness = 0.8;
spotlight2.shadowCameraNear = 10;
spotlight2.shadowCameraFar = 1000;
spotlight2.shadowCameraFov = 90;
spotlight2.position.set(10, 40, 150);
spotlight2.intensity = 1.5;
scene.add(spotlight2);


//floor
var floorgeo = new THREE.PlaneGeometry(400, 400, 1, 1);
var floorTexture = new THREE.ImageUtils.loadTexture('img/back2.jpg');
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
var floormat = new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.DoubleSide });
var floormesh = new THREE.Mesh(floorgeo, floormat);

floormesh.rotation.x = Math.PI / 2;
floormesh.position.z = -200;
floormesh.position.y = -40;
floormesh.receiveShadow = true;
scene.add(floormesh);

// model rendering
loader = new THREE.JSONLoader();
loader.load("model/50s_politician4v2.js", function(geometry, mats) {

    mats.forEach(function(mat) {
        mat.skinning = true;
        //mat.morphTargets = true;
    });

    mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshFaceMaterial(mats));
    //THREE.AnimationHandler.add(mesh.geometry.animations[0]);
    mesh.skeleton.bones[0].position.set(0, 0, 0);
    // mesh.position.set(0,-10,0);
    mesh.scale.set(5.8, 5.8, 5.8);
    mesh.castShadow = true;

    scene.add(mesh);

    convert_quaternion();
    render();

});




// Convert quaternion
function convert_quaternion() {



    // (1)mocapの生データをクオータニオン配列に入れる
    var mocap_ref = new Array(25);

    // ------ test data (frame, global or local)
    // ------ indexはthreejsの骨構造に対応
    // ------ threejsに対応するmocapデータはgitlabを参照(formatter準備中)
    
    // hands up (frame = 11220, local)
    // mocap_ref[0] = new THREE.Quaternion(-0.053169, -0.011979, -0.008823, 0.998475);
    // mocap_ref[1] = new THREE.Quaternion(0.177588, 0.004803, -0.001686, -0.984092);
    // mocap_ref[2] = new THREE.Quaternion(-0.042283, 0.001676, 0.035977, -0.998456);
    // mocap_ref[3] = new THREE.Quaternion(-0.393937, 0.062225, -0.040133, -0.91615);
    // mocap_ref[4] = new THREE.Quaternion(0.024381, 0.074839, -0.052144, -0.995533);
    //
    // mocap_ref[5] = new THREE.Quaternion(-0.028243, -0.13115, 0.127561, 0.982716);
    // mocap_ref[6] = new THREE.Quaternion(-0.0135, -0.263623, -0.092481, 0.960087);
    // mocap_ref[7] = new THREE.Quaternion(-0.320285, -0.307518, 0.027676, 0.895592);
    // mocap_ref[8] = new THREE.Quaternion(0.854024, 0.136836, 0.318309, 0.38807);
    //
    // mocap_ref[11] = new THREE.Quaternion(-0.023729, 0.115854, -0.059153, 0.991219);
    // mocap_ref[12] = new THREE.Quaternion(0.210766, 0.248293, 0.01326, 0.945385);
    // mocap_ref[13] = new THREE.Quaternion(-0.344295, 0.228597, -0.056828, 0.908832);
    // mocap_ref[14] = new THREE.Quaternion(0.033448, 0.011394, -0.062871, 0.997396);
    //
    // mocap_ref[18] = new THREE.Quaternion(0.079987, 0.040876, 0.018494, 0.995786);
    // mocap_ref[19] = new THREE.Quaternion(-0.010083, 0.000379, -0.039754, 0.999159);
    // mocap_ref[20] = new THREE.Quaternion(-0.046444, 0.08301, -0.006855, 0.995442);
    //
    // mocap_ref[22] = new THREE.Quaternion(0.081056, 0.007718, -0.053353, 0.995251);
    // mocap_ref[23] = new THREE.Quaternion(0.024119, 0.034385, 0.09024, 0.995034);
    // mocap_ref[24] = new THREE.Quaternion(-0.077622, -0.19376, 0.018898, 0.977791);



    // left leg step (frame = 6450, local)
    mocap_ref[0] = new THREE.Quaternion(0.00078, -0.025904, 0.020794, 0.999448);
    mocap_ref[1] = new THREE.Quaternion(0.163683, -0.043802, 0.018997, -0.985357);
    mocap_ref[2] = new THREE.Quaternion(-0.120966, -0.014624, -0.007974, -0.992517);
    mocap_ref[3] = new THREE.Quaternion(-0.339632, 0.072611, -0.00992, -0.937699);
    mocap_ref[4] = new THREE.Quaternion(0.100455, 0.077602, -0.066339, -0.98969);

    mocap_ref[5] = new THREE.Quaternion(0.121927, 0.106719, 0.049931, 0.985521);
    mocap_ref[6] = new THREE.Quaternion(0.114679, -0.097681, -0.611349, 0.776891);
    mocap_ref[7] = new THREE.Quaternion(-0.030698, 0.024205, -0.117167, 0.992343);
    mocap_ref[8] = new THREE.Quaternion(-0.889507, -0.061676, -0.177494, -0.416496);

    mocap_ref[11] = new THREE.Quaternion(0.013402, 0.028334, -0.021428, 0.999279);
    mocap_ref[12] = new THREE.Quaternion(0.473767, 0.434216, 0.268285, 0.717652);
    mocap_ref[13] = new THREE.Quaternion(-0.391706, 0.386593, -0.131653, 0.824487);
    mocap_ref[14] = new THREE.Quaternion(0.021378, -0.070124, 0.114495, -0.990715);

    mocap_ref[18] = new THREE.Quaternion(-0.357725, 0.011533, 0.056288, 0.932058);
    mocap_ref[19] = new THREE.Quaternion(-0.600164, 0.02575, 0.12677, -0.789348);
    mocap_ref[20] = new THREE.Quaternion(-0.033589, 0.091653, -0.07044, 0.992728);

    mocap_ref[22] = new THREE.Quaternion(-0.014365, 0.028579, -0.081174, 0.996187);
    mocap_ref[23] = new THREE.Quaternion(-0.047967, -0.101633, -0.12603, -0.98564);
    mocap_ref[24] = new THREE.Quaternion(-0.067394, -0.213005, -0.03275, 0.974174);

    // left leg up (frame = 6025, local)
    // mocap_ref[0] = new THREE.Quaternion(-0.019947, 0.044499, 0.190599, 0.980456);
    // mocap_ref[1] = new THREE.Quaternion(0.162602, -0.028549, 0.0168, -0.986136);
    // mocap_ref[2] = new THREE.Quaternion(-0.143253, -0.009394, 0.084678, -0.986012);
    // mocap_ref[3] = new THREE.Quaternion(-0.372626, 0.109513, 0.011692, -0.921423);
    // mocap_ref[4] = new THREE.Quaternion(0.1086, 0.119475, -0.069863, -0.984404);
    //
    // mocap_ref[5] = new THREE.Quaternion(0.084699, 0.11589, 0.033328, 0.989083);
    // mocap_ref[6] = new THREE.Quaternion(0.078773, -0.209584, -0.567144, 0.792601);
    // mocap_ref[7] = new THREE.Quaternion(-0.121836, -0.061393, -0.043601, 0.98969);
    // mocap_ref[8] = new THREE.Quaternion(0.783877, 0.14632, 0.206276, 0.567078);
    //
    // mocap_ref[11] = new THREE.Quaternion(0.035003, 0.024477, -0.042669, 0.998176);
    // mocap_ref[12] = new THREE.Quaternion(0.486613, 0.249168, 0.408662, 0.730834);
    // mocap_ref[13] = new THREE.Quaternion(-0.47078, 0.201922, 0.084478, 0.854668);
    // mocap_ref[14] = new THREE.Quaternion(-0.045044, 0.455115, -0.136963, 0.878682);
    //
    // mocap_ref[18] = new THREE.Quaternion(-0.635749, 0.075607, 0.277245, 0.716409);
    // mocap_ref[19] = new THREE.Quaternion(-0.56709, 0.001998, 0.297136, -0.76819);
    // mocap_ref[20] = new THREE.Quaternion(-0.122627, 0.217292, -0.094196, 0.963781);
    //
    // mocap_ref[22] = new THREE.Quaternion(-0.005367, -0.047638, -0.2285, 0.972363);
    // mocap_ref[23] = new THREE.Quaternion(0.056299, -0.014487, 0.067868, 0.995999);
    // mocap_ref[24] = new THREE.Quaternion(-0.052239, -0.145423, -0.002817, 0.987985);

    // ------- test data end -----


    // (2) mocap_ref to mocap_abs（indexはkinectの骨構造に対応）
    // mocapのlocal書き出しは親の回転を考慮してクオータニオンが計算されているため、globalに変換
    var mocap_abs = new Array(25);
    mocap_abs[0] = new THREE.Quaternion().multiplyQuaternions(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, "XYZ")), mocap_ref[0]);
    mocap_abs[1] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[0], mocap_ref[1]);
    mocap_abs[20] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[1], mocap_ref[2]);
    mocap_abs[2] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[20], mocap_ref[3]);
    mocap_abs[3] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[2], mocap_ref[4]);

    mocap_abs[4] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[20].inverse(), mocap_ref[5]); // left shoulder
    mocap_abs[5] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[4], mocap_ref[6]);
    mocap_abs[6] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[5], mocap_ref[7]);

    mocap_abs[8] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[20].inverse(), mocap_ref[11]); // right shoulder
    mocap_abs[9] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[8], mocap_ref[12]);
    mocap_abs[10] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[9], mocap_ref[13]);

    mocap_abs[12] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[0], mocap_ref[18]); // hip left
    mocap_abs[13] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[12], mocap_ref[19]);
    mocap_abs[14] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[13], mocap_ref[20]);

    mocap_abs[16] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[0], mocap_ref[22]); // hip right
    mocap_abs[17] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[16], mocap_ref[23]);
    mocap_abs[18] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[17], mocap_ref[24]);



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

    mocapToKinectAbs[8] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // ShoulderRight
    mocapToKinectAbs[9] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI - Math.PI / 2, -Math.PI / 2, "XYZ")); // ElbowRight
    mocapToKinectAbs[10] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // WristRight

    mocapToKinectAbs[12] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI, Math.PI / 2, "XYZ")); // HipLeft
    mocapToKinectAbs[13] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI + Math.PI / 2, Math.PI, "XYZ")); // KneeLeft
    mocapToKinectAbs[14] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, Math.PI, "XYZ")); // AnkleLeft

    mocapToKinectAbs[16] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2, "XYZ")); // HipRight
    mocapToKinectAbs[17] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI - Math.PI / 2, -Math.PI, "XYZ")); // KneeRight
    mocapToKinectAbs[18] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, -Math.PI, "XYZ")); // AnkleRight

    var kinectAbs_rotq_preYflip = new Array(25);
    for (var i = 0; i < mocapToKinectAbs.length; i++) {
        if (!mocap_abs[i]) continue;
        kinectAbs_rotq_preYflip[i] = new THREE.Quaternion().multiplyQuaternions(mocap_abs[i], mocapToKinectAbs[i].inverse());
    }



    // (4) kinect Y flip (kinectカメラから見て右側が正のため、Y軸を対象に180°回転する必要がある)
    // 全部一緒
    var kinectYflip = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ"));

    var kinectAbs_rotq = new Array(25);
    for (var i = 0; i < kinectAbs_rotq.length; i++) {
        if (kinectAbs_rotq_preYflip[i]){
            var tmp_rot = new THREE.Vector3(kinectAbs_rotq_preYflip[i].x, kinectAbs_rotq_preYflip[i].y, kinectAbs_rotq_preYflip[i].z);
            tmp_rot.applyQuaternion(kinectYflip);
            kinectAbs_rotq[i] = new THREE.Quaternion(tmp_rot.x, tmp_rot.y, tmp_rot.z, kinectAbs_rotq_preYflip[i].w);
        } else {
            kinectAbs_rotq[i] = new THREE.Quaternion(0, 0, 0, 0);
        }
    }


    // 1. kinect-abs -> three-abs: 座標系変換
    // 全部一緒
    var kinectAbsToThreeAbs_rotq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, "XYZ"));


    // 配列の定義
    var three_rotq = new Array(25);
    for (var i = 0; i < three_rotq.length; i++) {
        if (!kinectAbs_rotq[i]) continue;
        var tmp_rot = new THREE.Vector3(kinectAbs_rotq[i].x, kinectAbs_rotq[i].y, kinectAbs_rotq[i].z);
        tmp_rot.applyQuaternion(kinectAbsToThreeAbs_rotq);
        three_rotq[i] = new THREE.Quaternion(tmp_rot.x, tmp_rot.y, tmp_rot.z, kinectAbs_rotq[i].w);
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
    three_rotq3[5] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[20].inverse(), three_rotq2[4]); // SL
    three_rotq3[6] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[4].inverse(), three_rotq2[5]); // EL
    three_rotq3[7] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[5].inverse(), three_rotq2[6]); // WL

    three_rotq3[11] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[20].inverse(), three_rotq2[8]); // SR
    three_rotq3[12] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[8].inverse(), three_rotq2[9]); // ER
    three_rotq3[13] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[9].inverse(), three_rotq2[10]); // WR

    // three_rotq3[17] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[0].inverse(),  three_rotq2[12] ); // HL
    three_rotq3[17] = new THREE.Quaternion(0, 0, 0, 1); // HL
    three_rotq3[18] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[0],  three_rotq2[12]); // KL
    three_rotq3[19] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[12].inverse(), three_rotq2[13]); // AL
    three_rotq3[20] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[13].inverse(), three_rotq2[14]); // AL

    // three_rotq3[21] = new THREE.Quaternion().multiplyQuaternions( three_rotq2[0].inverse(),  three_rotq2[16] ); // HR
    three_rotq3[21] = new THREE.Quaternion(0, 0, 0, 1); // HR
    three_rotq3[22] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[0],  three_rotq2[16]); // KR
    three_rotq3[23] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[16].inverse(), three_rotq2[17]); // AR
    three_rotq3[24] = new THREE.Quaternion().multiplyQuaternions(three_rotq2[17].inverse(), three_rotq2[18]); // AR

    for (var j = 0; j < three_rotq3.length; j++) {
        if(three_rotq3[j]){
            console.log(j);
            console.log(three_rotq3[j]);
            mesh.skeleton.bones[j].quaternion.copy(three_rotq3[j]);
        }
    }
}



//render
function render() {
    requestAnimationFrame(render);
    //setTimeout( render, 1000 / 20 );

    // kinectv2 quaternion -> threejs quaternion

    /*
     mesh.skeleton.bones[0].position.x = kinect_json[kinect_num].skeletons[0].joints[0].x * 0.03;
     mesh.skeleton.bones[0].position.y = kinect_json[kinect_num].skeletons[0].joints[0].y * 0.02;
     mesh.skeleton.bones[0].position.z = (kinect_json[kinect_num].skeletons[0].joints[0].z - 2.0) * -10;


     for(var i = 0; i < 20; i++){
     var kinect_rotqx = kinect_json[kinect_num].skeletons[0].joints[i].quaternion_x;
     var kinect_rotqy = kinect_json[kinect_num].skeletons[0].joints[i].quaternion_y;
     var kinect_rotqz = kinect_json[kinect_num].skeletons[0].joints[i].quaternion_z;
     var kinect_rotqw = kinect_json[kinect_num].skeletons[0].joints[i].quaternion_w;

     //kinect quaternion -> threejs quaternion
     var wrot = new THREE.Vector3( kinect_rotqx, kinect_rotqy, kinect_rotqz);
     wrot.applyQuaternion(vuvu[i]);
     var wq=new THREE.Quaternion(wrot.x,wrot.y,wrot.z,kinect_rotqw);
     var threeRot = new THREE.Quaternion();
     threeRot.multiplyQuaternions(wq,vivi[i]);

     // クォータニオンをコピー
     //mesh.skeleton.bones[i].quaternion.copy(threeRot);
     }
     */

    // トラックボールによるカメラのプロパティの更新
    trackball.update();

    // rendering scene from camera
    webglrenderer.render(scene, webglcamera);
}
