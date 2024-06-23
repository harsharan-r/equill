<p align="center"> 
  <img src="src/icon128.png" alt="Equill" width="128px" height="128px">
</p>
<h1 align="center"> Equill </h1>

## Overview

Hackathon project for WaffleHacks 2024

Write "equal", inclusive text that is welcoming to everyone:

![Screenshot 2024-06-23 110815](https://github.com/willzeng274/equill/assets/168918484/51e15659-707f-424e-9b7b-a14e40da4c90)

Promoting diversity & inclusion!

## Setup:
```sh
git clone https://github.com/willzeng274/equill.git
```
or alternatively, download the repository as a zip.

Developer environment setup:
```sh
bun install
bunx tailwindcss -i ./src/input.css -o ./src/output.css --watch
```

## How to load the chrome extension
1. go to `chrome://extensions`.

2. Toggle developer mode (this should be at the top right of the page).

3. Find the "Load unpacked" button positioned at the top left of the page.

4. Select the "src" folder.

5. Extension is now loaded. Pinning the extension is recommended for ease of usage.

## Features:
1. Ability to edit your text in real time and improve your language to ensure that any non-inclusive text is flagged.
2. Change the settings to switch the context of who you are speaking to - if the person is religious, from other nations such as: Saudi   
    Arabia or Iran - provides international usage
3. Provide effective reasoning and possible replacements for the highlighted non inclusive text

   
## Technology used:

To incorporate the project, we utilised the Cohere language model, and we implemented this in the format of a Google Extension. The state of the art LSTM, machine learning model that is popular for Natural Language Processing, from Cohere was used to process the input text and made it more inclusive through prompt engineering. Since we were on a time-crunch we decided to use a well-known pre-trained model, rather than training an LSTM from scratch. Tailwind CSS was used to style the chrome extension, so it is appealing for the user. 


## The Future of Equil: 
- Continuing to improve AI model accuracy with prompt adjustments and fine-tuning
- Real time - Further implementation
- More customizable
- Ability to give multiple different replacements and the user can choose what they prefer
- Make UI available outside of the side panel - highlighting text and allow the user to hover over the text, choosing what to replace
