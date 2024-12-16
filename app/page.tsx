'use client'

import { useState, useEffect } from 'react'
import liff from '@line/liff'
import { LIFF_ID } from './config'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// flexMessageの定義は変更なしのため省略

interface Profile {
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export default function LIFFApp() {
  const [isLiffInitialized, setIsLiffInitialized] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [friendUrl, setFriendUrl] = useState('https://line.me/R/ti/p/@example')
  const [adminUrl, setAdminUrl] = useState('https://example.com/mytrainer-admin')
  const [managerUrl, setManagerUrl] = useState('https://manager.line.biz')
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    const initLiff = async () => {
      try {
        setDebugInfo('LIFF初期化開始...')
        await liff.init({ liffId: LIFF_ID })
        setIsLiffInitialized(true)
        setDebugInfo(prevInfo => prevInfo + '\nLIFF初期化成功')
        if (liff.isLoggedIn()) {
          setIsLoggedIn(true)
          setDebugInfo(prevInfo => prevInfo + '\nユーザーはログイン済み')
          await fetchProfile()
        } else {
          setDebugInfo(prevInfo => prevInfo + '\nユーザーは未ログイン')
        }
      } catch (error) {
        console.error('LIFF initialization failed', error)
        setError(`LIFFの初期化に失敗しました: ${error instanceof Error ? error.message : String(error)}`)
        setDebugInfo(prevInfo => prevInfo + `\nLIFF初期化エラー: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    initLiff()
  }, [])

  const fetchProfile = async () => {
    setDebugInfo(prevInfo => prevInfo + '\nプロフィール取得開始...')
    if (!liff.isLoggedIn()) {
      setError('ユーザーがログインしていません。')
      setDebugInfo(prevInfo => prevInfo + '\nプロフィール取得エラー: ユーザーが未ログイン')
      return
    }

    try {
      const accessToken = liff.getAccessToken()
      setDebugInfo(prevInfo => prevInfo + `\nアクセストークン: ${accessToken ? '取得成功' : '取得失敗'}`)
      
      const profile = await liff.getProfile()
      setProfile(profile)
      setError(null)
      setDebugInfo(prevInfo => prevInfo + '\nプロフィール取得成功')
    } catch (error) {
      console.error('プロフィール取得エラー:', error)
      if (error instanceof Error) {
        if (error.message.includes('access token')) {
          setError('アクセストークンが無効です。再度ログインしてください。')
        } else if (error.message.includes('network')) {
          setError('ネットワークエラーが発生しました。接続を確認してください。')
        } else {
          setError(`プロフィールの取得に失敗しました: ${error.message}`)
        }
      } else {
        setError(`プロフィールの取得に失敗しました: ${String(error)}`)
      }
      setDebugInfo(prevInfo => prevInfo + `\nプロフィール取得エラー: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleLogin = async () => {
    setDebugInfo('ログイン処理開始...')
    if (!isLiffInitialized) {
      setError('LIFFが初期化されていません。')
      setDebugInfo(prevInfo => prevInfo + '\nログインエラー: LIFFが未初期化')
      return
    }
    try {
      await liff.login()
      setIsLoggedIn(true)
      setDebugInfo(prevInfo => prevInfo + '\nログイン成功')
      await fetchProfile()
    } catch (error) {
      console.error('ログインエラー:', error)
      setError(`ログインに失敗しました: ${error instanceof Error ? error.message : String(error)}`)
      setDebugInfo(prevInfo => prevInfo + `\nログインエラー: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleLogout = () => {
    setDebugInfo('ログアウト処理開始...')
    if (!isLiffInitialized) {
      setError('LIFFが初期化されていません。')
      setDebugInfo(prevInfo => prevInfo + '\nログアウトエラー: LIFFが未初期化')
      return
    }
    liff.logout()
    setIsLoggedIn(false)
    setProfile(null)
    setError(null)
    setDebugInfo(prevInfo => prevInfo + '\nログアウト成功')
  }

  const updateFlexMessage = () => {
    flexMessage.body.contents[0].contents[1].action.uri = friendUrl
    flexMessage.body.contents[1].contents[1].action.uri = adminUrl
    flexMessage.body.contents[2].contents[1].action.uri = managerUrl
  }

  const sendMessage = async () => {
    setDebugInfo(prevInfo => prevInfo + '\nメッセージ送信開始...')
    if (!isLiffInitialized) {
      setError('LIFFが初期化されていません。')
      setDebugInfo(prevInfo => prevInfo + '\nメッセージ送信エラー: LIFFが未初期化')
      return
    }

    if (!liff.isInClient()) {
      setError('このアプリはLINE内でのみ動作します。')
      setDebugInfo(prevInfo => prevInfo + '\nメッセージ送信エラー: LINE外での実行')
      return
    }

    updateFlexMessage()

    try {
      await liff.sendMessages([
        {
          type: 'flex',
          altText: 'MY TRAINER環境発行完了',
          contents: flexMessage
        }
      ])
      setDebugInfo(prevInfo => prevInfo + '\nメッセージ送信成功')
      alert('メッセージが正常に送信されました！')
    } catch (error) {
      console.error('メッセージ送信エラー:', error)
      setError(`メッセージの送信に失敗しました: ${error instanceof Error ? error.message : String(error)}`)
      setDebugInfo(prevInfo => prevInfo + `\nメッセージ送信エラー: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // updateFlexMessage, sendMessage, shareMessage 関数は変更なしのため省略

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>LIFF Flex Message Editor</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isLoggedIn && profile && (
            <div className="flex items-center space-x-4 mb-4">
              <Avatar>
                <AvatarImage src={profile.pictureUrl} />
                <AvatarFallback>{profile.displayName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{profile.displayName}</p>
                <p className="text-sm text-gray-500">{profile.statusMessage}</p>
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="friendUrl" className="block text-sm font-medium text-gray-700">友だち追加URL</label>
              <Input
                id="friendUrl"
                type="text"
                value={friendUrl}
                onChange={(e) => setFriendUrl(e.target.value)}
                placeholder="https://line.me/R/ti/p/@example"
              />
            </div>
            <div>
              <label htmlFor="adminUrl" className="block text-sm font-medium text-gray-700">管理画面URL</label>
              <Input
                id="adminUrl"
                type="text"
                value={adminUrl}
                onChange={(e) => setAdminUrl(e.target.value)}
                placeholder="https://example.com/mytrainer-admin"
              />
            </div>
            <div>
              <label htmlFor="managerUrl" className="block text-sm font-medium text-gray-700">LINE公式アカウント管理画面URL</label>
              <Input
                id="managerUrl"
                type="text"
                value={managerUrl}
                onChange={(e) => setManagerUrl(e.target.value)}
                placeholder="https://manager.line.biz"
              />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700">デバッグ情報</h3>
            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded">{debugInfo}</pre>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="flex justify-between w-full">
            <Button onClick={sendMessage} disabled={!isLoggedIn}>メッセージを送信</Button>
            <Button onClick={shareMessage} disabled={!isLoggedIn}>メッセージを共有</Button>
          </div>
          {isLoggedIn ? (
            <Button onClick={handleLogout} variant="outline" className="w-full">ログアウト</Button>
          ) : (
            <Button onClick={handleLogin} variant="outline" className="w-full">LINEでログイン</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

