const process = () => {
  const [prop, topic] = init()

  // News APIからニュースを取得
  const newsTitles = fetchNews(prop, topic);

  // Geminiでニュースを要約
  const newsSummary = summarizeNews(prop, newsTitles);

  // ニュースのサマリをLINEに投稿
  sendLineNotification(prop, newsSummary);
}

const init = () => {
  const prop = PropertiesService.getScriptProperties().getProperties();
  const topic = 'business';

  return [prop, topic];
}

const fetchNews = (prop, topic) => {
  const newsApiKey = prop.NEWS_API_KEY;
  const newsApiUrl = `https://newsapi.org/v2/top-headlines?country=jp&category=${topic}&apiKey=${newsApiKey}`;  const newsApiOptions = {
    'method': 'get',
    'contentType': 'application/json'
  };

  const newsData = (() => {
    try {
      const newsApiResponse = UrlFetchApp.fetch(newsApiUrl, newsApiOptions);
      return JSON.parse(newsApiResponse.getContentText());
    } catch(e) {
      console.error(e);
      exit();
    }
  })();

  // ニュース記事のタイトルを抽出
  const newsTitles = newsData.articles.map(article => article.title).join('\n');

  return newsTitles;
}

const summarizeNews = (prop, newsTitles) => {
  const geminiApiKey = prop.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;

  // Geminiに送るプロンプト
  let prompt = `以下のニュース記事を条件に従い簡潔にまとめてください。\n\n${newsTitles}`;
  prompt += '\n\n条件';
  prompt += '\n・文字数は合計900文字以内にしてください。';
  prompt += '\n・一番大きなタイトルは---今日のニュース🐰---としてください。';
  prompt += '\n・トピックごとの見出しは【】で囲い、適切な絵文字をつけてください。';
  prompt += '\n・トピックは「・」で区切ってください。';
  prompt += '\n・最後に【まとめ】を作ってください。';

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify({"contents":[{"parts":[{"text":prompt}]}]})
  };

  const data = (() => {
    try {
      const response = UrlFetchApp.fetch(url, options);
      return JSON.parse(response.getContentText());
    } catch(e) {
      console.error(e);
      exit();
    }
  })();

  // Geminiの回答を抽出
  const newsSummary = data.candidates[0].content.parts[0].text;

  return newsSummary;
}

const sendLineNotification = (prop, message) => {
  const token = [prop.LINE_NOTIFY_API_TOKEN_HORI, prop.LINE_NOTIFY_API_TOKEN_HIMA];

  for (let i = 0; i < token.length; i++) {
    const url = 'https://notify-api.line.me/api/notify';
    const headers = {
      'Authorization': `Bearer ${token[i]}`
    };

    const options = {
      'method': 'post',
      'headers': headers,
      'payload': { 'message': message }
    };

    try {
      UrlFetchApp.fetch(url, options);
    } catch (e) {
      console.error(e);
      exit();
    }
  }
}
