export const mobileNowPlayingCss = `
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes am-marquee {
    0%, 18%  { transform: translateX(0); }
    50%      { transform: translateX(var(--marquee-dist)); }
    68%, 100%{ transform: translateX(0); }
  }

  /* Custom range thumb for progress */
  .am-progress-range {
    -webkit-appearance: none;
    appearance: none;
    position: absolute;
    inset: -8px 0;
    width: 100%;
    height: calc(100% + 16px);
    background: transparent;
    cursor: pointer;
    z-index: 10;
    margin: 0;
    padding: 0;
  }
  .am-progress-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 0;
    height: 0;
    opacity: 0;
    transition: width 0.15s, height 0.15s, opacity 0.15s;
  }
  .am-progress-range:active::-webkit-slider-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    opacity: 1;
  }
  .am-progress-range::-moz-range-thumb {
    width: 0;
    height: 0;
    opacity: 0;
    border: none;
    background: transparent;
    transition: width 0.15s, height 0.15s, opacity 0.15s;
  }
  .am-progress-range:active::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    opacity: 1;
  }

  /* Volume range */
  .am-vol-range {
    -webkit-appearance: none;
    appearance: none;
    position: absolute;
    inset: -6px 0;
    width: 100%;
    height: calc(100% + 12px);
    background: transparent;
    cursor: pointer;
    z-index: 10;
    margin: 0;
    padding: 0;
  }
  .am-vol-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px; height: 12px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }
  .am-vol-range::-moz-range-thumb {
    width: 12px; height: 12px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    border: none;
  }

  /* Bottom action button hover */
  .am-action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.15s ease;
  }
  .am-action-btn:active {
    background: rgba(255,255,255,0.08);
  }
`;
