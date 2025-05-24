
import { StoryContentData, FileSystemNodeType, ShellMessage, CharacterCommandResponses, SystemMessagesConfig, DialogueEntry } from '../../../types';

const story01WelcomeConnectionSequence: ShellMessage[] = [
  { id: 's1_conn_01', type: 'system', text: 'Initializing connection to Story 1 Node...' },
  { id: 's1_conn_02', type: 'progress', text: '.......... 25%' },
  { id: 's1_conn_03', type: 'system', text: 'Authenticating credentials for "Scarlet Log"...' },
  { id: 's1_conn_04', type: 'progress', text: '.................... 75%' },
  { id: 's1_conn_05', type: 'system', text: 'Authentication successful. Welcome, Operator.' },
  { id: 's1_conn_06', type: 'progress', text: '.............................. 100% Complete.' },
  { id: 's1_conn_07', type: 'system', text: 'Secure channel established. Loading mission parameters...' },
];

const adminAlexCommandResponses: CharacterCommandResponses = {
  submitEvidence: {
    "E003_SecretZipDecrypted": {
      responseText: "これは…非常に深刻です。Luna自身のログです。これを私に持ってきてくれてありがとう。これで全てが変わります。",
      trustChange: 30,
    },
    "E004_RivalEmailAccess": {
      responseText: "RivalStreamerXのメールへのアクセス？それはかなりの進展ですね。これで私の疑いが確信に変わりました。",
      trustChange: 20,
    }
  },
  defaultSubmitEvidence: {
    responseText: "興味深い証拠ですね（'{EVIDENCE_TITLE}'）。考慮に入れます。", // {EVIDENCE_TITLE} will be replaced
    trustChange: 10,
  }
};

const story01SystemMessages: SystemMessagesConfig = {
  command_usage: "使用法: {COMMAND_SYNTAX}",
  error_command_usage: "使用法: {COMMAND_SYNTAX}",
  error_file_not_found: "エラー: ファイル '{FILE_NAME}' が見つかりません。",
  error_not_a_directory: "エラー: '{PATH_NAME}' はディレクトリではありません。",
  error_path_not_found: "エラー: パス '{PATH_NAME}' が見つかりません。",
  error_is_a_directory: "エラー: '{PATH_NAME}' はファイルではなくディレクトリです。",
  error_encrypted: "エラー: ファイル '{FILE_NAME}' は暗号化されています。`decrypt`コマンドを使用してください。",
  error_invalid_password: "エラー: 不正なパスワードです。",
  info_decryption_success: "ファイル '{FILE_NAME}' は正常に解読されました。",
  info_file_not_encrypted: "ファイル '{FILE_NAME}' は暗号化されていません。",
  error_unknown_command: "不明なコマンド: {COMMAND_NAME}。「help」と入力して利用可能なコマンドを表示してください。",
  info_analysis_notFound: "分析対象'{TARGET_NAME}'が見つからないか、分析できません。",
  info_new_evidence_added: "新しい証拠'{EVIDENCE_TITLE}'がData Repositoryに追加されました。",
  connect_failed_default: "{TARGET_HOST}への接続に失敗しました: ホスト不明または到達不能です。",
  reset_password_success: "アカウント '{ACCOUNT_NAME}' のパスワードリセットに成功しました。",
  reset_password_failure: "アカウント '{ACCOUNT_NAME}' のパスワードリセットに失敗しました。情報が間違っています。",
  reset_password_target_not_found: "アカウント '{ACCOUNT_NAME}' が見つからないか、パスワードリセットの対象ではありません。",
  submit_evidence_char_not_found: "キャラクターID '{CHAR_ID}' が見つかりません。",
  submit_evidence_item_not_found: "証拠ID '{EVIDENCE_ID}' が見つからないか、まだ発見されていません。",
  submit_evidence_default_ack: "{CHAR_NAME} は証拠 '{EVIDENCE_TITLE}' を確認しました。",
  email_char_not_found_error: "メール送信エラー: 対象キャラクターID '{CHAR_ID}' が見つかりません。",
  email_no_reply_default: "{CHAR_NAME} からの返信はありませんでした。",
  story_complete_message: "このストーリーは完了しました。「exit」でログアウトし、次のストーリーに進んでください。",
  investigation_ended_message: "捜査は終了しました。「help」コマンドで確認するか、「clear」または「exit」以外、これ以上のコマンドは受け付けられません。",
  runtime_error_command: "コマンド'{COMMAND_NAME}'の実行中にランタイムエラーが発生しました。",
  empty_directory: "(空のディレクトリ)",
};

const adminAlexDialogue: Record<string, DialogueEntry | string[]> = {
    "hello": { responses: ["システム管理者アレックスです。捜査のお手伝いをいたしましょうか？"] },
    "Luna_Live": { responses: ["Luna？彼女は才能のあるストリーマーです。彼女の失踪を非常に心配しています。何かご存知ですか？"] },
    "RivalStreamerX": { responses: ["RivalStreamerX？彼らはLunaと…競争関係にありました。具体的な情報はありますか？"] },
    "Luna_memo": {
      responses: ["Lunaのメモ？それは機密事項です。どうやって…もしお持ちなら、重要な情報が含まれているかもしれません。何を見つけましたか？"],
      requiredTrustMin: 0 // Default, accessible
    },
    "secret.zip_low_trust": { // Example of specific entry for trust gating, though general mechanism is better
      responses: ["それは機密情報です。それについて話す前に、もっとあなたを信頼する必要があります。"],
      requiredTrustMin: 0,
      requiredTrustMax: 69
    },
    "secret.zip": {
      responses: ["暗号化されたzipですか？もし解読できたなら、その内容は非常に重要かもしれません。"],
      requiredTrustMin: 0 // Can be discussed even with low trust, but content is sensitive
    },
    "default": { responses: ["よく理解できません。もっと具体的に説明していただけますか？", "それについて助けるには、もっと文脈が必要です。", "その情報にアクセスするには、より高いクリアランスまたはより具体的なクエリが必要です。"] }
};


export const story01Content: StoryContentData = {
  storyInfo: {
    storyNumber: 1,
    title: "Scarlet Log",
    description: "Investigate the disappearance of streamer Luna_Live.",
    nextStoryNumber: null // No next story defined yet
  },
  connectionSequence: story01WelcomeConnectionSequence,
  initialFileSystem: {
    "/": {
      type: FileSystemNodeType.DIRECTORY,
      name: "/",
      children: {
        "logs": {
          type: FileSystemNodeType.DIRECTORY,
          name: "logs",
          children: {
            "system.log": {
              name: "system.log",
              content: "2024-07-28 10:00:00 SYS: システムブート開始。\n2024-07-28 10:01:15 USR_AdminAlex: ログイン成功。\n2024-07-28 10:05:30 SYS: ネットワークインターフェース eth0 アクティブ。\n2024-07-28 11:30:00 USR_Luna_Live: IP 192.168.1.101 から接続確立。\n2024-07-28 11:32:15 USR_Luna_Live: ファイル /user/Luna_Live/documents/final_stream_notes.txt にアクセス。\n2024-07-28 11:35:00 USR_Luna_Live: /admin/restricted_area へのアクセス試行 - 拒否。\n2024-07-28 12:00:00 USR_RivalStreamerX: IP 203.0.113.45 からのログイン試行 - 失敗 (不正なパスワード)。\n2024-07-28 12:01:00 USR_RivalStreamerX: IP 203.0.113.45 からのログイン試行 - 失敗 (不正なパスワード)。\n2024-07-28 12:02:30 USR_RivalStreamerX: アカウント 'rival_email' のパスワードリセット要求。セキュリティ質問のヒント: 「子供の頃のお気に入りの場所」。\n2024-07-28 14:00:00 USR_Luna_Live: 切断。\n2024-07-28 18:00:00 SYS_ALERT: Luna_Liveのアカウントで異常なアクティビティ検出。ファイル 'Luna_memo.log' フラグ設定。\n2024-07-28 18:05:00 USR_AdminAlex: アラート調査中。'Luna_memo.log'にアクセス。\n",
              canAnalyze: true,
              analysisResult: "system.logの分析により、Luna_Liveの活動、AdminAlexの行動、およびRivalStreamerXによる複数回の失敗したログイン試行が明らかになります。「rival_email」のパスワードリセットが要求され、ヒントは「子供の頃のお気に入りの場所」でした。これはソーシャルエンジニアリングパズルの重要な手がかりのようです。"
            },
            "Luna_memo.log": {
              name: "Luna_memo.log",
              content: "Personal Memo - Luna\n自分へ: RivalStreamerXからのプレッシャーを感じている。彼らの行動がおかしい。\n重要なファイルをバックアップする必要がある。新しい子猫「コメット」は手がかかるけど愛らしい。\n秘密のアーカイブのパスワード：私の小さな毛玉に関連している。油断できない。\nRivalStreamerXが最近チャットで「オールドオークツリー」公園の近くで育ったと話していた。奇妙な自慢だ。\n何かが絶対におかしい。アレックスに話さなければ。",
              canAnalyze: true,
              analysisResult: "Lunaのメモには、RivalStreamerXに関する懸念と「コメット」という名前の子猫について言及されています。これは「secret.zip」のパスワードである可能性が高いです。また、RivalStreamerXが「オールドオークツリー」公園について言及していることも記されており、これが彼らのセキュリティの質問の答えになる可能性があります。"
            }
          }
        },
        "files": {
          type: FileSystemNodeType.DIRECTORY,
          name: "files",
          children: {
            "secret.zip": {
              name: "secret.zip",
              content: "これは暗号化されたアーカイブです。",
              isEncrypted: true,
              password: "Comet", // This is the actual password, puzzle definition can refer to hints
              decryptedContent: "secret.zipの解読された内容:\n\nEvidence Log - Luna\n\nRivalStreamerXから脅迫メッセージが送られてきています。コピーを持っています。\n彼らは私の今後のチャリティーストリームを妨害しようとしています。\n彼らが私のアカウントにアクセスしようとするのではないかと疑っています。\n私のメインメールはluna.live.stream@example.com、ライバルのメールはrival.streamer.x@example.comです。\n\n何かあったら、AdminAlexにDMを確認するように伝えてください。そこに証拠を送りました。\nこのzipファイルは私のバックアップ証拠です。",
              canAnalyze: false
            },
            "welcome.txt": {
              name: "welcome.txt",
              content: "ようこそ、捜査官。匿名の情報提供がありました。あなたがアクセスしているファイルシステムは、システム管理者AdminAlexのものです。あなたの任務は、ストリーマー、Luna_Live失踪の背後にある真実を明らかにすることです。手がかりを見つけるために `ls`、`cd`、`cat`、`analyze` のようなコマンドを使用してください。コマンドのリストについては `help` と入力してください。"
            }
          }
        },
        "users": {
          type: FileSystemNodeType.DIRECTORY,
          name: "users",
          children: {
            "AdminAlex": {
              type: FileSystemNodeType.DIRECTORY,
              name: "AdminAlex",
              children: {
                "desktop": {
                  type: FileSystemNodeType.DIRECTORY,
                  name: "desktop",
                  children: {
                    "note.txt": { name: "note.txt", content: "リマインダー: ストリーマーアカウントのセキュリティプロトコルを確認する。" }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  evidence: {
    "E001_LunaMemo": {
      id: "E001_LunaMemo",
      title: "Luna_memo.log",
      content: "Personal Memo - Luna\n自分へ: RivalStreamerXからのプレッシャーを感じている。彼らの行動がおかしい。\n重要なファイルをバックアップする必要がある。新しい子猫「コメット」は手がかかるけど愛らしい。\n秘密のアーカイブのパスワード：私の小さな毛玉に関連している。油断できない。\nRivalStreamerXが最近チャットで「オールドオークツリー」公園の近くで育ったと話していた。奇妙な自慢だ。\n何かが絶対におかしい。アレックスに話さなければ。",
      type: "log_entry",
      source: "/logs/Luna_memo.log"
    },
    "E002_SystemLog": {
      id: "E002_SystemLog",
      title: "system.log",
      content: "2024-07-28 10:00:00 SYS: システムブート開始。\n2024-07-28 10:01:15 USR_AdminAlex: ログイン成功。\n2024-07-28 10:05:30 SYS: ネットワークインターフェース eth0 アクティブ。\n2024-07-28 11:30:00 USR_Luna_Live: IP 192.168.1.101 から接続確立。\n2024-07-28 11:32:15 USR_Luna_Live: ファイル /user/Luna_Live/documents/final_stream_notes.txt にアクセス。\n2024-07-28 11:35:00 USR_Luna_Live: /admin/restricted_area へのアクセス試行 - 拒否。\n2024-07-28 12:00:00 USR_RivalStreamerX: IP 203.0.113.45 からのログイン試行 - 失敗 (不正なパスワード)。\n2024-07-28 12:01:00 USR_RivalStreamerX: IP 203.0.113.45 からのログイン試行 - 失敗 (不正なパスワード)。\n2024-07-28 12:02:30 USR_RivalStreamerX: アカウント 'rival_email' のパスワードリセット要求。セキュリティ質問のヒント: 「子供の頃のお気に入りの場所」。\n2024-07-28 14:00:00 USR_Luna_Live: 切断。\n2024-07-28 18:00:00 SYS_ALERT: Luna_Liveのアカウントで異常なアクティビティ検出。ファイル 'Luna_memo.log' フラグ設定。\n2024-07-28 18:05:00 USR_AdminAlex: アラート調査中。'Luna_memo.log'にアクセス。\n",
      type: "log_entry",
      source: "/logs/system.log"
    },
    "E003_SecretZipDecrypted": {
      id: "E003_SecretZipDecrypted",
      title: "Decrypted Content (secret.zip)",
      content: "secret.zipの解読された内容:\n\nEvidence Log - Luna\n\nRivalStreamerXから脅迫メッセージが送られてきています。コピーを持っています。\n彼らは私の今後のチャリティーストリームを妨害しようとしています。\n彼らが私のアカウントにアクセスしようとするのではないかと疑っています。\n私のメインメールはluna.live.stream@example.com、ライバルのメールはrival.streamer.x@example.comです。\n\n何かあったら、AdminAlexにDMを確認するように伝えてください。そこに証拠を送りました。\nこのzipファイルは私のバックアップ証拠です。",
      type: "text",
      source: "/files/secret.zip"
    },
    "E004_RivalEmailAccess": {
      id: "E004_RivalEmailAccess",
      title: "ライバルストリーマーメールアクセス許可",
      content: "rival_email@example.comへのアクセスが許可されました。Luna_Liveに対する妨害計画について話し合っているDMが見つかりました。",
      type: "text"
    }
  },
  puzzles: {
    "P001_DecryptSecretZip": {
      id: "P001_DecryptSecretZip",
      description: "secret.zipを解読する",
      puzzleType: 'decryption',
      targetFilePath: "/files/secret.zip", // Path to the file to be decrypted
      correctPassword: "Comet", // This is the actual password
      relatedEvidenceIds: ["E001_LunaMemo"], // Evidence that might hint at the password
      unlocksEvidenceOnSuccess: ["E003_SecretZipDecrypted"],
      narrativeScriptKeySuccess: "puzzle_P001_decrypted"
    },
    "P002_SocialEngineerRival": {
      id: "P002_SocialEngineerRival",
      description: "rival_emailのパスワードをリセットする",
      puzzleType: 'passwordReset',
      targetAccount: "rival_email", // Or "rival.streamer.x@example.com"
      securityQuestionAnswerPairs: [
        { 
          questionHint: "子供の頃のお気に入りの場所", // Hint from system.log
          answers: ["oldoaktree", "オールドオークツリー"] // Case-insensitive comparison in logic
        }
      ],
      relatedEvidenceIds: ["E001_LunaMemo", "E002_SystemLog"],
      unlocksEvidenceOnSuccess: ["E004_RivalEmailAccess"],
      narrativeScriptKeySuccess: "puzzle_P002_access_granted",
      // narrativeScriptKeyFailure: "puzzle_P002_reset_failed" // Optional failure script
    }
  },
  characters: {
    "AdminAlex": {
      id: "AdminAlex",
      name: "AdminAlex",
      initialTrustLevel: 50,
      minReadDelayMs: 400, maxReadDelayMs: 6000, readDelayJitterMs: 800,
      minReplyDelayMs: 1200, maxReplyDelayMs: 20000, replyDelayJitterMs: 1500,
      dialogueState: adminAlexDialogue,
      commandResponses: adminAlexCommandResponses,
    },
    "MysteriousInformant": {
      id: "MysteriousInformant",
      name: "Mysterious Informant",
      initialTrustLevel: 100,
      minReadDelayMs: 100, maxReadDelayMs: 500, readDelayJitterMs: 50,
      minReplyDelayMs: 200, maxReplyDelayMs: 1000, replyDelayJitterMs: 100,
      dialogueState: {
        "initial_message": { responses: ["データはあなたのものになりました。真実を見つけてください。Lunaはあなたを頼りにしています。"] },
         "default": { responses: ["沈黙は金。"] }
      }
    }
  },
  narrativeScript: {
    "welcome": [
      { id: "ns_welcome_s1_1", type: "system", source: "Mysterious Informant", text: "データはあなたのものになりました。真実を見つけてください。Lunaはあなたを頼りにしています。" },
      { id: "ns_welcome_s1_2", type: "system", text: "シミュレートされたファイルシステムへのアクセスが許可されました。" },
      { id: "ns_welcome_s1_3", type: "system", text: "開始するには `cat /files/welcome.txt` と入力してください。" }
    ],
    "puzzle_P001_decrypted": [
      { id: "p001s_1_story1", type: "system", text: "解読成功！新しい証拠「E003_SecretZipDecrypted」がData Repositoryに追加されました。" }
    ],
    "puzzle_P002_access_granted": [
      { id: "p002s_1_story1", type: "system", text: "rival_email@example.comのパスワードリセットに成功しました。アクセス許可。新しい証拠「E004_RivalEmailAccess」がData Repositoryに追加されました。" }
    ],
    "final_choice_rival_success": [
      { id: "fc_r_1_story1", type: "system", text: "RivalStreamerXに対する有力な証拠が集まりました。ケースは提出されました。" },
      { id: "fc_r_2_story1", type: "system", text: "結果: RivalStreamerXは逮捕されました。Luna_Liveは無事発見されましたが、動揺しています。あなたの鋭い捜査能力のおかげで、正義は果たされました。" }
    ],
    "final_choice_insufficient": [
      { id: "fc_i_1_story1", type: "system", text: "あなたは決定を下しましたが、特定の個人に対する明確な解決には証拠が不十分でした。" },
      { id: "fc_i_2_story1", type: "system", text: "結果: 事件は未解決のままです。Luna_Liveの運命は不確かです。解決が難しい謎もあります。" }
    ],
    "story_completed_success": [
        { id: "scs1_story1", type: "system", text: "おめでとうございます！ストーリー「Scarlet Log」をクリアしました。" },
        { id: "scs2_story1", type: "system", text: "ログアウトして再度ログインすると、次のストーリー（利用可能な場合）に進むことができます。" }
    ],
    "story_completed_end": [
        { id: "sce1_story1", type: "system", text: "Anonymous File: Scarlet Logをプレイしていただきありがとうございます。" }
    ]
  },
  initialPlayerStateOverrides: {
    currentPath: "/",
    gameStage: "introduction",
    narrativeFlags: {
      intro_complete: false,
      contacted_admin_alex: false,
      final_choice_made: ""
    },
    discoveredEvidenceIds: [],
    solvedPuzzleIds: []
  },
  clearConditions: { 
    completionType: "narrativeFlag",
    flagName: "story_completed_successfully", 
    expectedValue: true
  },
  connectionPoints: {
    "adminalex_system": {
      successResponseText: "AdminAlex_systemに接続中...\n接続が確立されました。",
      setNarrativeFlags: { "contacted_admin_alex": true }
    },
    "adminalex": { 
      successResponseText: "AdminAlex_systemに接続中...\n接続が確立されました。",
      setNarrativeFlags: { "contacted_admin_alex": true }
    }
  },
  analysisInsights: {},
  accusationRules: [
    {
      accusedEntityKeywords: ["rivalstreamerx", "rival streamer x"],
      requiredEvidenceIds: ["E003_SecretZipDecrypted", "E004_RivalEmailAccess"], 
      isCorrectEnding: true, 
      narrativeScriptKeySuccess: "final_choice_rival_success",
    }
  ],
  defaultAccusationFailureNarrativeScriptKey: "final_choice_insufficient",
  systemMessages: story01SystemMessages,
};