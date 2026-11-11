# Nishurato — Digital World

Интерактивный сайт по макету Figma: перемещение и масштабирование поля, выбор узлов и анимированная информационная панель. Сайт полностью статический; сборка и установка зависимостей не нужны.

## Структура

```text
.github/workflows/pages.yml   Автоматическая публикация GitHub Pages
index.html                   Перенаправление с корня на dist/index.html
dist/                        Всё, что публикуется на сайте
  index.html                 Главная страница
  style.css                  Оформление и адаптивность
  app.js                     Интерактивность
  assets/                    Изображения, SVG и шрифты
  .nojekyll                  Отключение обработки Jekyll
scripts/check-site.mjs       Проверка путей к ресурсам
server.mjs                   Только локальный сервер предпросмотра
package.json                 Команды разработки и проверки
```

Редактируйте файлы непосредственно в `dist/`: это исходники статического сайта, а не автоматически создаваемая папка сборки. Workflow создаёт папку `_site/` с корневым `index.html` и папкой `dist/`. Корневая страница перенаправляет посетителя на `dist/index.html`; сервер и служебные файлы проекта в публикацию не попадают.

## Публикация на GitHub Pages

1. Отправьте изменения в ветку `main` репозитория `Nishurato/digital-world-website`.
2. В репозитории откройте **Settings → Pages → Build and deployment → Source** и выберите **GitHub Actions**.
3. Откройте **Actions → Deploy GitHub Pages → Run workflow**, если автоматический запуск уже завершился до включения Pages.

После успешного выполнения workflow сайт будет доступен по адресу:

https://nishurato.github.io/digital-world-website/

Следующие отправки изменений в `main` будут автоматически обновлять сайт. Адрес активной публикации также отображается в окружении `github-pages` и в настройках Pages. Если правила репозитория требуют подтверждения deployment, подтвердите его в GitHub.

Все пути к ресурсам относительные: сайт работает как из подпапки репозитория, так и на отдельном домене. Инструкция GitHub: [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Локальный запуск

Нужен Node.js 24. Из корня проекта:

```sh
npm run dev
```

Откройте http://127.0.0.1:3000. Проверка JavaScript и наличия ресурсов:

```sh
npm run check
```

## Содержимое

Тексты узлов находятся в объекте `data` в `dist/app.js`, адреса соцсетей — в `socialLinks`. Ссылки открываются в новой вкладке. Цвет иконок при наведении — `#0000A3`, при нажатии — `#8A8AFF`.
