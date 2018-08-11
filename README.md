# README
## directoryの構成
```
amd_kinect_quaternion
├── css
├── img
│   └── img
├── js
│   ├── converter
│   ├── filter
│   ├── formatter
├── lib
└── model
```

### (1)js/ *.js
- 概要：three.jsを使用するものに関して保存
 - input_predict_correct.js ... kinect, mocap, predictを描画比較するために使用
 - quantitative_evaluation.js ... 定量評価を計算するために使用
 - quantitative_evaluation_methods.js ... quantitative_evaluation_methods.jsの計算メソッドの中身

### (2)js/filter
- 概要：変換/ノイズ付加のためのコードを保存
 - applyNormRand.js ... ノイズ付加に使用
 - movingAverage_oneEuro.js ... 推定エラー補正後のモーションの移動平均フィルタとoneEuroフィルタを適用するために使用
 - mocap_to_kinectCoordinate.js ... mocapからkinectへ変換する際に使用
 
### (3)js/formatter
- 概要：変換のためのコードを保存(最終的にjsに改修)
 - kinect_format.js ... kinectの生データを学習データ形式に変換するために使用
 - mocap_local_format.js ... mocapの生データを学習データ形式に変換するために使用

