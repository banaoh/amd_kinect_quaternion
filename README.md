# README
## directoryの構成
```
amd_kinect_quaternion
├── coordinate_transformation ... (1)
├── css
├── formatter ... (2)
├── img
│   └── img
├── js ... (3)
├── lib
└── model
```
### (1)coordinate_transformation
- 概要：変換/ノイズ付加のためのコードを保存
 - applyNormRand.js ... ノイズ付加に使用
 - applyNormalize_MovingAverage.js ... 推定エラー補正後のモーションの移動平均の計算に使用
 - interp_from_csv.js ... mocapからkinectへ変換する際に使用
 - kinect_format.js ... kinectの生データを学習データ形式に変換するために使用
 - mocap_local_format.js ... mocapの生データを学習データ形式に変換するために使用

### (2)formatter
- 概要：変換のためのコードを保存(最終的にjsに改修)
 - kinect.rb ... kinectの生データを学習データ形式に変換するために使用(kinect_format.jsに書き換え)
 - mocap_local.rb ... mocapの生データを学習データ形式に変換するために使用(mocap_local_format.jsに書き換え)

### (3)js
- 概要：three.jsを使用するものに関して保存
 - 3motion_data_comparison.js ... kinect, mocap, predictを描画比較するために使用
 - calc_MSE.js ... 定量評価を計算するために使用
 - quantitative_evaluation_methods.js ... MSE.jsの計算メソッドの中身
 - input_predicted_correct_(euler, position).js ... eulerやpositionを表示するために使用
