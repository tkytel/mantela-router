# Mantela Router — Telephone Network Mandala Router

**Mantela Router** は、[**Mantela**](https://github.com/tkytel/mantela) で記述された電話局同士のつながりから電話番号を検索します。

## URL パラメータについて

`first` の値として、電話網の起点となる mantela.json の URL を指定できます。
例えば、
`https://tkytel.github.io/mantela-viewer/?first=https://example.com/.well-known/mantela.json`
のようにすると、
自動的に `https://example.com/.well-known/mantela.json` を起点とした電話網を検索します。
