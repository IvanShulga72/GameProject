# Пошаговая игра "РОГАЛИК" на JavaScript

Это простая пошаговая игра "РОГАЛИК", реализованную на чистом JavaScript. 
В игре вы сможете управлять героем, перемещаясь по карте, атаковать противников и собирать предметы.
Цель игры - уничтожить всех противников.
(Проект реализован для компании ПроНетКом)

## Исходные данные

Архив с файлами HTML, CSS, JavaScript (включая jQuery) и изображениями.

## Технологии

- JavaScript 
- jQuery
- HTML5
- Git
- GitHub

## Особенности

- Генерация случайной карты 40x24 клетки.
- Реализованы вертикальные и горизонтальные проходы между комнатами.
- Реализован случайный размещение мечей (2 шт) и зелий здоровья (10 шт) на карте.
- Противники (10 шт) размещаются случайным образом.
- Передвижение героя осуществляется клавишами WASD и стрелки.
- Атака всех противников на соседних клетках осуществляется клавишей пробел.
- Противник атакует героя, если они находятся на соседних клетках.
- Реализовано случайное передвижение противников.
- Восстановление здоровья при наступлении на зелье здоровья.
- Увеличение силы удара героя при наступлении на меч.

## Запуск

Для запуска игры откройте файл `index.html` в браузере. Или посмотрите готовое решение на сайте: https://game-project-xrdo.vercel.app/

## Пояснения к пунктам ТЗ

- **Генерация карты**: Создается двумерный массив, каждый элемент которого обозначает тип клетки (стена или пол).
- **Заполнение карты стенами**: Весь массив заполняется элементами "wall".
- **Размещение комнат**: Создаются случайные прямоугольные комнаты с размерами от 3x3 до 8x8 клеток.
- **Размещение проходов**: Генерируются случайные вертикальные и горизонтальные проходы шириной в 1 клетку.
- **Размещение мечей и зелий здоровья**: Случайным образом выбираются пустые клетки на карте, куда размещаются предметы.
- **Помещение героя и противников**: Герой и противники размещаются на случайных пустых клетках.
- **Передвижение героя**: Герой перемещается по карте с помощью клавиш WASD.
- **Атака противников**: Противники атакуют героя, если он находится на соседней клетке.
- **Случайное передвижение противников**: Противники случайным образом перемещаются по карте.
- **Восстановление здоровья и увеличение силы удара**: Герой восстанавливает здоровье и увеличивает силу удара при наступлении на соответствующие предметы.
