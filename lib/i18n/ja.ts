// Japanese translations — music/fitness app vernacular
// 「ウォーク」= walk, 「楽曲」= composition, 「楽器」= instrument, 「音階」= scale
import type { TranslationKey } from "./en"

const ja: Record<TranslationKey, string> = {
  // Navigation
  "nav.feed":          "フィード",
  "nav.map":           "マップ",
  "nav.record":        "記録",
  "nav.ensemble":      "アンサンブル",
  "nav.profile":       "プロフィール",
  "nav.settings":      "設定",

  // Login
  "login.tagline":     "あなたの歩み、あなたの音楽。",
  "login.sub":         "一歩一歩が音符に。ウォークが楽曲になる。",
  "login.cta":         "Googleでログイン",
  "login.terms":       "ログインすることで同意したとみなします",
  "login.terms.link":  "利用規約・プライバシーポリシー",

  // Pre-record settings
  "record.new":        "新しい楽曲",
  "record.subtitle":   "ウォーク前に設定してください。",
  "record.title":      "タイトル",
  "record.title.ph":   "朝の公園散歩…",
  "record.instrument": "楽器",
  "record.note":       "開始音",
  "record.scale":      "音階",
  "record.genre":      "ジャンル",
  "record.start":      "記録を開始",
  "record.free.limit": "無料プラン：録音時間の合計は30分まで。",
  "record.pro.lock.instruments": "バイオリン・ドラムはProプランで利用可能",
  "record.pro.lock.genres":      "ジャズ・アンビエント・エレクトロニックはProプランで利用可能",

  // HUD
  "hud.duration":      "経過時間",
  "hud.distance":      "距離",
  "hud.bearing":       "方位",
  "hud.stop":          "停止して作曲",
  "hud.wait":          "GPSデータを収集中…もう少し歩いてください。",
  "hud.composing":     "楽曲を生成中…",
  "hud.processing":    "{n}個の音符から{genre}の楽曲を作成しています。",
  "hud.free.left":     "無料プランの残り時間：{n}分",
  "hud.free.done":     "制限時間に達しました — 停止します…",

  // Activity detail
  "activity.duration": "経過時間",
  "activity.distance": "距離",
  "activity.bpm":      "平均BPM",
  "activity.like":     "いいね",
  "activity.share":    "シェア",
  "activity.public":   "公開",
  "activity.private":  "非公開",
  "activity.delete":   "アクティビティを削除",
  "activity.delete.confirm": "削除しますか？",
  "activity.delete.yes":     "はい",
  "activity.delete.cancel":  "キャンセル",
  "activity.delete.ing":     "削除中…",

  // Composition player
  "player.loading.piano": "ピアノ音源を読み込み中…",
  "player.loading":       "読み込み中…",

  // Comments
  "comments.none":      "コメントなし",
  "comments.count":     "{n}件のコメント",
  "comments.count.pl":  "{n}件のコメント",
  "comments.show":      "表示",
  "comments.hide":      "非表示",
  "comments.empty":     "最初のコメントを書いてみましょう。",
  "comments.ph":        "コメントを追加…",
  "comments.error.load":"コメントを読み込めませんでした。",
  "comments.error.post":"コメントの投稿に失敗しました。もう一度お試しください。",
  "comments.error.net": "通信エラーが発生しました。接続を確認してください。",
  "comments.retry":     "再試行",

  // Profile
  "profile.compositions":       "楽曲数",
  "profile.walked":             "歩行距離",
  "profile.followers":          "フォロワー",
  "profile.following":          "フォロー中",
  "profile.edit":               "プロフィールを編集",
  "profile.no.activities":      "公開中の楽曲はまだありません。",
  "profile.compositions.label": "楽曲",

  // Level progress
  "level.clefs":   "{n} / {cap} 楽曲",
  "level.max":     "最高レベル達成",
  "level.next":    "あと{n}曲で{name}に到達",
  "level.next.pl": "あと{n}曲で{name}に到達",
  "level.challenge.locked":  "シークレットチャレンジ",
  "level.challenge.unlock":  "{n}曲達成で解放",
  "level.cond.compositions": "{n}曲",
  "level.cond.scales":       "{n}種類の音階",
  "level.cond.instruments":  "{n}種類の楽器",
  "level.cond.or":           "または",
  "level.reveal.title":      "チャレンジ解放！",
  "level.reveal.unlocked":   "の条件が公開されました",
  "level.reveal.sub":        "このレベルを目指して作曲を続けましょう。必要な条件はこちらです：",
  "level.reveal.cta":        "了解！",

  // Settings
  "settings.title":         "設定",
  "settings.account":       "アカウント",
  "settings.account.name":  "名前",
  "settings.account.email": "メールアドレス",
  "settings.plan":          "プラン",
  "settings.plan.free":     "無料",
  "settings.plan.pro":      "Pro",
  "settings.plan.upgrade.desc": "Proにアップグレードして、無制限の録音・全ジャンル・スタイル分析などを解放しましょう。",
  "settings.plan.upgrade.btn":  "Proにアップグレード",
  "settings.profile":       "プロフィール",
  "settings.username":      "ユーザー名",
  "settings.username.hint": "半角英数字とアンダースコアのみ。3文字以上。",
  "settings.units":         "単位",
  "settings.units.metric":  "メートル法 (km)",
  "settings.units.imperial":"ヤード法 (mi)",
  "settings.language":      "言語",
  "settings.bio":           "自己紹介",
  "settings.bio.ph":        "自分について一言…",
  "settings.country":       "国",
  "settings.country.ph":    "国を選択…",
  "settings.interests":     "好きな音楽ジャンル",
  "settings.save":          "変更を保存",
  "settings.saving":        "保存中…",
  "settings.saved":         "保存しました！",
  "settings.privacy":       "プライバシーとデータ",
  "settings.privacy.desc":  "位置情報データはアクティビティ記録の一部としてのみ保存され、第三者に販売されることはありません。",
  "settings.privacy.policy":"プライバシーポリシー",
  "settings.terms":         "利用規約",
  "settings.export":        "データをエクスポート",
  "settings.export.desc":   "アカウント・プロフィール・アクティビティ・楽曲データをJSONでダウンロードできます。",
  "settings.delete":        "アカウントを削除",
  "settings.delete.desc":   "アカウントとすべてのデータを完全に削除します。この操作は取り消せません。",
  "settings.delete.warning":"アカウント、すべての楽曲、アクティビティ、プロフィールデータが完全に削除されます。",
  "settings.delete.confirm.label": "確認のため「DELETE」と入力してください",
  "settings.delete.btn":    "アカウントを削除する",
  "settings.delete.ing":    "削除中…",
  "settings.cancel":        "キャンセル",
  "settings.signout":       "ログアウト",
  "settings.style":         "スタイルプロフィール",
  "settings.style.pro":     "Proプランで、あなたの音楽的ペルソナとスタイルタグが表示されます。",
  "settings.upgraded":      "Cadenzio Proへようこそ！",
  "settings.upgraded.sub":  "サブスクリプションが有効になりました。すべての機能が利用可能です。",

  // Dashboard
  "dashboard.title":       "フィード",
  "dashboard.discover":    "作曲家を探す",
  "dashboard.empty.title": "まだ楽曲がありません",
  "dashboard.empty.sub":   "ウォークを始めて最初の楽曲を作るか、他の作曲家をフォローしてみましょう。",
  "dashboard.empty.cta":   "記録を開始",

  // Scale names
  "scale.major":            "メジャー",
  "scale.natural_minor":    "マイナー",
  "scale.blues":            "ブルース",
  "scale.pentatonic_major": "ペンタトニック",
  "scale.dorian":           "ドリアン",
  "scale.lydian":           "リディアン",

  // Genre names
  "genre.classical":   "クラシック",
  "genre.blues":       "ブルース",
  "genre.jazz":        "ジャズ",
  "genre.ambient":     "アンビエント",
  "genre.electronic":  "エレクトロニック",

  // Misc
  "upgrade.cta":   "アップグレード",
  "error.generic": "エラーが発生しました。もう一度お試しください。",
}

export default ja
