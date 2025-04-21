# kawasemi-emojidic

かわせみ4用の絵文字の辞書を作るためのプログラムです。

## おまけ

full-emoji-list.txt はこうしてつくられる！

```shellsession
grep -E "^([0-9A-F]{4,5}|[0-9A-F]{4} FE0F)\s+; fully-qualified" v16-emoji-test.txt \
| grep -v "200D" \
| sed -n 's/.*# \([^ ]*\) .*/\1/p' \
 > full-emoji-list.txt
```
