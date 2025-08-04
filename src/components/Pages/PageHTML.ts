import Defaults from '../Global/Defaults';

export const PageHTML = `
<div class="NotificationContainer"></div>
<div class="ContentBox">
    <div class="NowBar"></div>
    <div class="LyricsContainer">
        <div class="loaderContainer">
            <div id="DotLoader"></div>
        </div>
        <div class="LyricsContent ScrollbarScrollable"></div>
    </div>
    <div class="ViewControls"></div>
    <div class="DropZone LeftSide">
        <span>Switch Sides</span>
    </div>
    <div class="DropZone RightSide">
        <span>Switch Sides</span>
    </div>
</div>
`;

export const NowBarHTML = `
<div class="CenteredView">
    <div class="Header">
        <div class="MediaBox">
            <div class="MediaContent" draggable="true"></div>
            <div class="MediaImagePlaceholder"></div>
            <img class="MediaImage"
                 src=""
                 data-high-res=""
                 fetchpriority="high"
                 loading="eager"
                 decoding="sync"
                 draggable="true"  alt=""/>
        </div>
        <div class="Metadata">
            <div class="SongName">
                <span></span>
            </div>
            <div class="Artists">
                <span></span>
            </div>
        </div>
    </div>
    <div class="AmaiPageButtonContainer">
        <button id="RefreshLyrics" class="AmaiPageButton">
            Reload Current Lyrics
        </button>
        <button id="WatchMusicVideoButton" class="AmaiPageButton">
            Watch Music Video
        </button>
        <span onclick="window.open('https://github.com/hudzax/amai-lyrics/releases')" class="amai-version-number">Amai Lyrics v${Defaults.Version}</span>
    </div>
</div>
`;
