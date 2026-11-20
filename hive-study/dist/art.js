const Art = (() => {
  const paths={
    book:'<path d="M3 5c3-1 6-.6 9 1.5C15 4.4 18 4 21 5v14c-3-1-6-.6-9 1.5C9 18.4 6 18 3 19z"/><path d="M12 6.5v14"/>',
    board:'<path d="m12 2 8.7 5v10L12 22l-8.7-5V7z"/><path d="m7.7 9.5 4.3-2.6 4.3 2.6v5L12 17l-4.3-2.5z"/>',
    chart:'<path d="M4 19h16M6.5 15v-3m5.5 3V6m5.5 9V9"/>',
    mix:'<path d="M3 6h3c4.5 0 6.5 12 11 12h4m-3-3 3 3-3 3M3 18h3c1.7 0 3.2-1.7 4.5-4M14 8c1-1.3 2-2 3-2h4m-3-3 3 3-3 3"/>',
    bulb:'<path d="M8 15a7 7 0 1 1 8 0c-1 .8-1.3 1.7-1.3 3H9.3c0-1.3-.4-2.2-1.3-3zM10 21h4"/>',
    reset:'<path d="M4 10a8 8 0 1 1 2 7M3.5 4.5V10H9"/>',
    pointer:'<path d="m5 3 14 9-7 1-3 7z"/>',
    pin:'<path d="m8 3 9 3-2 2-1.2 5 2.1 3-10.1-3.4 3.4-1.4L11 6zM10 15l-2.5 6"/>',
    layers:'<path d="m12 3 9 5.4-9 5.4-9-5.4zM3.5 12.5l8.5 5 8.5-5m-17 4L12 21l8.5-4.5"/>',
    shield:'<path d="M12 2.5c2.2 2 5 3.2 8 3.4v6.3c0 4-3.3 7-8 9.4-4.7-2.4-8-5.4-8-9.4V6c3-.3 5.8-1.5 8-3.5z"/><path d="m8.2 12 2.5 2.5 5-5"/>',
    surround:'<path d="m12 5 6 3.5v7l-6 3.5-6-3.5v-7z"/><circle cx="12" cy="12" r="2.2"/><path d="M12 2v3m8.7 1.5L18 8m2.7 9.5L18 16M12 22v-3m-8.7-1.5L6 16M3.3 6.5 6 8"/>',
    check:'<path d="m4.5 12 5 5 10-11"/>',x:'<path d="m6 6 12 12M18 6 6 18"/>',
    eye:'<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/>',
    target:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3m10 7h-3m-7 10v-3M2 12h3"/>',
    rotate:'<path d="M19.5 10a8 8 0 0 0-14.8-2M20 4v6h-6M4.5 14a8 8 0 0 0 14.8 2M4 20v-6h6"/>',
    leaf:'<path d="M4 17c0-10 7-12 16-13 0 10-5 16-12 14M5 20l10-11"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.5"/>'
  };
  const icon=(id,size=20)=>'<svg aria-hidden="true" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+paths[id]+'</svg>';
  // Original overhead insect illustrations. The same marks label the board and reserve.
  const legs=(d)=>'<path d="'+d+'" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
  const fill=(d)=>'<path d="'+d+'" fill="currentColor"/>';
  const bug={
    M:legs("M0 15V-11L4-19M-3-4-13-10-17-5M3-4 13-10 17-5M-2 1-12 9-12 18M2 1 12 9 12 18")+fill("M-2-5Q-23-22-19-9q4 10 17 10zM2-5Q23-22 19-9Q15 1 2 1zM-2 0h4L0 18z"),
    L:fill("M-6-10Q0-19 6-10L8-7H-8zM-1-6v24Q-16 14-12 0q3-7 11-6zM1-6q9-1 12 6 4 14-12 18z")+'<g fill="var(--tile-dot,#eee)"><circle cx="-7" cy="1" r="2.1"/><circle cx="7" cy="1" r="2.1"/><circle cx="-6" cy="9" r="1.8"/><circle cx="6" cy="9" r="1.8"/></g>',
    P:fill("M-7-10q7-11 14 0zM-9-8H9l2 4h-22zM-12-2h24v4h-24zM-12 4h24l-1 4h-22zM-10 10h20l-2 4H-8zM-7 16H7q-7 8-14 0z"),
    A:legs('M-3-5-11-12-14-21M3-5 11-12 14-21M-5-2-14-6-19-2M5-2 14-6 19-2M-5 2-14 6-18 13M5 2 14 6 18 13M-3-13-8-19-7-23M3-13 8-19 7-23')+'<g fill="currentColor"><ellipse cy="-10.5" rx="5.4" ry="5.8"/><ellipse cy="-1" rx="4.4" ry="5.8"/><circle cy="5.8" r="2.5"/><ellipse cy="14.2" rx="6.6" ry="8.5"/></g>',
    Q:legs('M-3-12-8-19-12-20M3-12 8-19 12-20M-5-1-13 4-16 12M5-1 13 4 16 12M-5 3-10 13-11 18M5 3 10 13 11 18')+'<g fill="none" stroke="currentColor" stroke-width="2"><path d="M-3-6c-3-9-12-13-15-6-4 9 5 17 14 13zM3-6c3-9 12-13 15-6 4 9-5 17-14 13z"/><path d="m-16-10 12 9m20-9L4-1" opacity=".7"/></g><circle cy="-11" r="4.1" fill="currentColor"/><ellipse cy="-4" rx="5.4" ry="5" fill="currentColor"/>'+fill('M-5 2Q0 0 5 2L6 6H-6zM-6 8H6L5 12H-5zM-4.5 14h9Q3 18 0 21q-3-3-4.5-7z'),
    B:legs('M-6-6-13-10-14-16M6-6 13-10 14-16M-8 0-16 0-19-4M8 0 16 0 19-4M-7 7-12 13-17 15M7 7 12 13 17 15M-3-13-6-18M3-13 6-18')+fill('M-5-13Q0-20 5-13l1 4H-6zM-8-7Q0-11 8-7l2 5H-10zM-.9 0v19Q-13 16-10 1zM.9 0l9 1q4 15-9 18z'),
    S:legs('M-4-3-11-11-10-21M4-3 11-11 10-21M-5-2-16-7-20-18M5-2 16-7 20-18M-5 1-16 4-21 13M5 1 16 4 21 13M-4 3-11 11-12 21M4 3 11 11 12 21')+'<ellipse cy="7" rx="6.8" ry="8.7" fill="currentColor"/><ellipse cy="-3" rx="5.2" ry="5.8" fill="currentColor"/>'+legs('M-2-6-3-11M2-6 3-11'),
    G:legs('M5-10 9-19 17-22M7-10 16-16 22-16M-2-1-14-9-17 7-22 15M2 1 13 10 7 16M1-5 12-3 16 4')+fill('M-16 17q4-13 13-23l7-4 3 4Q0 5-16 17zM1-7q-1-6 5-8 8-2 7 5-1 4-7 4z')+legs('M-14 16-7 2 0-2')
  };
  const mark='<svg aria-hidden="true" viewBox="0 0 46 46" width="44" height="44"><path d="m23 1 19 11v22L23 45 4 34V12z" fill="#244b42"/><g transform="translate(23 23) scale(.77)" color="#f6ce71">'+bug.Q+'</g></svg>';
  return {icon,bug,mark};
})();

