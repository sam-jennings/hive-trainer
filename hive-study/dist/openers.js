// Openers / counter-openers. One entry = one opener (a move history the rules engine replays)
// plus the replies the learner can play from it. Add a new opener by adding an entry here only.
// h: [pieceId, "q,r"] per ply, White first. Axial coordinates as in rules.js.
// replies[].verdict: "best" completes the drill, "playable" and "weak" explain and let the learner retry.
// replies[].type (optional): opening family the checker must find after the reply (C, Z, I, J, F, X).
// replies[].pins / .frees (optional): piece that must have no move / some move after the reply.
const Openers = [
 {id:"first-bug",group:"First placement",pages:"57, 209-210",
  name:"Your first bug",
  summary:"White's opening placement. Choose the bug that will start the hive.",
  goal:"You are White. Place your first bug.",
  hint:"Your first bug is pinned at once by your own second bug. Pick one that can still climb or jump out later.",
  h:[],
  replies:[
   {name:"Grasshopper first",verdict:"best",moves:[["wG1","0,0"]],why:"Your second bug will pin the first one straight away. A grasshopper can still jump out of a closed space later, so it stays useful."},
   {name:"Beetle first",verdict:"best",moves:[["wB1","0,0"]],why:"Like the grasshopper, a beetle can climb out of an enclosed space, so being pinned early costs little. Ingersoll names hopper or beetle as the usual base-game starts."},
   {name:"Spider first",verdict:"playable",moves:[["wS1","0,0"]],why:"A spider cannot get out of an enclosed space. Strong players sometimes start with one on purpose to add distance between the queens, but it costs a tempo."},
   {name:"Ant first",verdict:"weak",moves:[["wA1","0,0"]],why:"Your best mover is pinned from move one and stays buried. Ingersoll's first beginner lesson: don't start with an ant."},
   {name:"Queen first",verdict:"weak",moves:[["wQ1","0,0"]],why:"Tournament rules forbid the queen on turn one, and it puts your queen where the hive will grow around her."}
  ],
  other:"That bug is not one of the book starts. Think about which bugs can escape once they are hemmed in."},

 {id:"elbow-queen",group:"Queen placement",pages:"223-225",
  name:"Against White's elbow queen",
  summary:"Both sides opened with a grasshopper. White put the queen in an elbow. You place your queen last, so you pick the opening.",
  goal:"You are Black. Place your queen to choose the opening.",
  hint:"Your queen can go inline (straight on from your grasshopper) or in either elbow. Which side of the centre line keeps the queens apart?",
  h:[["wG1","0,0"],["bG1","1,0"],["wQ1","-1,1"]],
  replies:[
   {name:"Z Opening",verdict:"best",type:"Z",moves:[["bQ1","2,-1"]],why:"Queens on opposite sides of the centre line. The game opens up; White attacks first, but Black gets excellent counter-attacking chances if the queen defence holds."},
   {name:"C Opening",verdict:"playable",type:"C",moves:[["bQ1","1,1"]],why:"Queens on the same side. Close queens make a draw more likely and the game turns on two critical spaces. A fair choice against a stronger player if a draw is fine for you."},
   {name:"F Opening",verdict:"weak",type:"F",moves:[["bQ1","2,0"]],why:"An inline queen against White's elbow. Your defenders cannot slip out efficiently and you lack the counter-attack of the I Opening. Ingersoll says this highly favours White."},
   {name:"Delayed queen (X Opening)",verdict:"weak",type:"X",moves:[["bA1","2,0"]],why:"Holding the queen back pins more of your own bugs and loses a tempo. For Black that lost tempo can mean a quick loss."}
  ],
  other:"Any move that delays your queen leaves you a tempo behind. Get the queen into play now."},

 {id:"inline-queen",group:"Queen placement",pages:"223-226",
  name:"Against White's inline queen",
  summary:"White started with a beetle and placed the queen inline, straight behind it. You place your queen last.",
  goal:"You are Black. Place your queen to choose the opening.",
  hint:"White's inline queen has trouble freeing its defenders. Don't copy that weakness.",
  h:[["wB1","0,0"],["bG1","1,0"],["wQ1","-1,0"]],
  replies:[
   {name:"J Opening",verdict:"best",type:"J",moves:[["bQ1","1,1"],["bQ1","2,-1"]],why:"An elbow queen against White's inline queen. You keep the space inside the elbow, so a defender can be freed later, while White carries the inline problem. Either elbow works."},
   {name:"I Opening",verdict:"weak",type:"I",moves:[["bQ1","2,0"]],why:"Both queens inline. With correct play this clearly favours White, because Black's defenders cannot escape against an aggressive attack."},
   {name:"Delayed queen (X Opening)",verdict:"weak",type:"X",moves:[["bS1","2,0"]],why:"Delaying the queen costs Black a tempo and self-pins extra bugs. Ingersoll does not recommend it."}
  ],
  other:"Any move that delays your queen leaves you a tempo behind. Get the queen into play now."},

 {id:"white-last",group:"Queen placement",pages:"58, 223-225",
  name:"White places the queen last",
  summary:"White played an ant on turn two, so Black placed the queen first, in the lower elbow. Now White chooses the opening.",
  goal:"You are White. Place your queen to choose the opening.",
  hint:"White wants a wide-open game to use the first-move initiative. Put the queens on opposite sides of the centre line.",
  h:[["wG1","0,0"],["bG1","1,0"],["wA1","-1,0"],["bQ1","1,1"]],
  replies:[
   {name:"Z Opening",verdict:"best",type:"Z",moves:[["wQ1","0,-1"]],why:"Queens on opposite sides gives the open game where White attacks early. This is the choice from Ingersoll's example game."},
   {name:"C Opening",verdict:"playable",type:"C",moves:[["wQ1","-1,1"]],why:"Legal and sound, but close queens favour a draw, which suits Black more than the side with the initiative."},
   {name:"Queen away from the first bug (X Opening)",verdict:"weak",type:"X",moves:[["wQ1","-2,0"]],why:"Your queen touches only the ant, so the grasshopper and the ant are both pinned. You give back the first-move advantage."},
   {name:"Delay the queen again",verdict:"weak",type:"X",moves:[["wS1","0,-1"]],why:"Waiting until turn four to place the queen limits White's early mobility. Play the queen early."}
  ],
  other:"Delaying the queen gives away White's opening initiative."},

 {id:"z-pin",group:"First attack",pages:"29-30, 225",
  name:"Z Opening: pin the black queen",
  summary:"A Z Opening. White has an ant in play; Black just added a spider. White's opening goal is to immobilise the black queen as fast as possible.",
  goal:"You are White. Stop the black queen from moving.",
  hint:"A bug that touches only the black queen pins her: she can't move without breaking the hive.",
  h:[["wG1","0,0"],["bG1","1,0"],["wQ1","-1,1"],["bQ1","2,-1"],["wA1","-1,2"],["bS1","2,0"]],
  replies:[
   {name:"Ant pins the queen",verdict:"best",pins:"bQ1",moves:[["wA1","2,-2"],["wA1","3,-2"]],why:"Your ant touches only the black queen, so she cannot move without disconnecting it. White has met the third opening goal: the black queen is immobile."},
   {name:"Develop another bug",verdict:"playable",frees:"bQ1",moves:[["wA2","0,2"],["wS1","0,2"],["wG2","0,2"]],why:"Bringing in more bugs is useful, but the black queen can still walk to safety. Pinning her first keeps the initiative."},
   {name:"Ant beside the queen, not a pin",verdict:"weak",frees:"bQ1",moves:[["wA1","1,-1"],["wA1","3,-1"]],why:"The ant also touches other bugs, so the hive stays connected without the queen. She can still slide away."}
  ],
  other:"That move leaves the black queen free to move. Look for a space that touches the queen and nothing else."},

 // ---- Batch 2 (OPENERS-BATCH2-NOTES.md). Cells are reconstructions of the book's figures.
 {id:"x-answer",group:"Queen placement",pages:"30, 223-224, 227",
  name:"Answering an X Opening",
  summary:"White opened with a hopper and then an ant, holding the queen back (an X Opening). It is your second turn.",
  goal:"You are Black. Answer White's delayed queen.",
  hint:"White has spent a tempo. Don't give it back: get your own queen into play next to your first bug.",
  h:[["wG1","0,0"],["bG1","1,0"],["wA1","-1,0"]],
  replies:[
   {name:"Queen in an elbow",verdict:"best",moves:[["bQ1","1,1"],["bQ1","2,-1"]],why:"Your queen is in play early and your bugs can start moving, while White's bugs cannot move until the white queen arrives. The elbow keeps a space your defenders can escape through."},
   {name:"Queen inline",verdict:"playable",moves:[["bQ1","2,0"]],why:"Getting the queen in is what matters most, but an inline queen gives your defenders no efficient escape later (p. 224)."},
   {name:"Delay your queen too",verdict:"weak",moves:[["bA1","1,1"],["bA1","2,-1"],["bA1","2,0"],["bS1","1,1"],["bS1","2,-1"],["bS1","2,0"],["bG2","1,1"],["bG2","2,-1"],["bG2","2,0"],["bB1","1,1"],["bB1","2,-1"],["bB1","2,0"]],why:"For White an X Opening costs a tempo; for Black the lost tempo could mean a quick loss (p. 227). None of your bugs can move until your queen is down."}
  ],
  other:"Place your queen now. It is critical to get the queen into play early so friendly bugs can move."},

 {id:"c-take-a",group:"C Opening",pages:"224-225",
  name:"C Opening: take your critical space",
  summary:"A C Opening: both queens in an elbow above the centre line. White developed a spider instead of taking critical space B next to your queen. Black's critical space A touches the white queen.",
  goal:"You are Black. Use your ant to win the fight for the critical spaces.",
  hint:"There are two critical spaces above the gap between the queens. The one next to the white queen is yours.",
  h:[["wG1","0,0"],["bG1","1,0"],["wQ1","0,-1"],["bQ1","2,-1"],["wA1","-1,1"],["bA1","1,1"],["wS1","-1,0"]],
  replies:[
   {name:"Ant takes space A",verdict:"best",pins:"wQ1",moves:[["bA1","1,-2"]],why:"If Black occupies space A before White occupies B, Black's game improves immensely (p. 224). Here the ant touches only the white queen, so she is pinned as well."},
   {name:"Occupy space B yourself",verdict:"playable",pins:"bQ1",moves:[["bA1","2,-2"],["bA2","2,-2"],["bG2","2,-2"],["bS1","2,-2"],["bB1","2,-2"]],why:"It keeps White out of B, but the bug touches only your queen, so she now pins herself. Space A is the one that helps Black."},
   {name:"Ant into the gap between the queens",verdict:"weak",frees:"wG1",moves:[["bA1","1,-1"]],why:"A bug inside the elbow frees the defending white hopper (p. 224), and both critical spaces are still open for White."},
   {name:"New bug away from the critical spaces",verdict:"weak",moves:[["bA2","2,0"],["bG2","2,0"],["bS1","2,0"],["bB1","2,0"]],why:"White's ant can reach space B next move. White has the upper hand if B is taken before A (p. 224)."}
  ],
  other:"That move leaves the critical spaces to White. Look at the space above the gap that touches the white queen."},

 {id:"c-take-b",group:"C Opening",pages:"224-225",
  name:"C Opening: White takes the critical space",
  summary:"A C Opening: both queens in an elbow above the centre line. Both sides have an ant in play. Critical space B touches the black queen.",
  goal:"You are White. Win the fight for the critical spaces.",
  hint:"Two critical spaces lie above the gap between the queens. Take the one next to the black queen before Black takes the other.",
  h:[["wG1","0,0"],["bG1","1,0"],["wQ1","0,-1"],["bQ1","2,-1"],["wA1","-1,1"],["bA1","1,1"]],
  replies:[
   {name:"Ant takes space B",verdict:"best",pins:"bQ1",moves:[["wA1","2,-2"]],why:"White has the upper hand if he occupies space B before Black occupies A (p. 224). The ant touches only the black queen, so she is pinned too."},
   {name:"Pin the queen from the far side",verdict:"playable",pins:"bQ1",moves:[["wA1","3,-2"]],why:"The black queen is pinned, but space B is still empty and Black's ant can still take space A."},
   {name:"Ant beside the queen, not a pin",verdict:"weak",frees:"bQ1",moves:[["wA1","2,0"]],why:"The ant also touches Black's first hopper, so the black queen can still move, and space B is still empty."},
   {name:"New bug away from the queens",verdict:"weak",frees:"bQ1",moves:[["wA2","-1,0"],["wS1","-1,0"],["wG2","-1,0"],["wB1","-1,0"]],why:"Black's ant can reach space A next move. If Black occupies A first, Black's game improves immensely (p. 224)."},
   {name:"Walk the queen",verdict:"weak",frees:"bQ1",moves:[["wQ1","-1,0"],["wQ1","1,-1"]],why:"A queen move spends the tempo White needs to take space B."}
  ],
  other:"That move leaves space B for later. Find the space above the gap that touches the black queen."},

 {id:"tempo-leave-ant",group:"First attack",pages:"217-218",
  name:"Don't waste tempo: leave the ant",
  summary:"A Z Opening. Your ant has pinned the black queen. Black answered by placing a second hopper beside the spider.",
  goal:"You are White. Keep the pin and add to the attack.",
  hint:"Moving a bug twice can lose a tempo. Your ant is already doing its job.",
  h:[["wG1","0,0"],["bG1","1,0"],["wQ1","-1,1"],["bQ1","2,-1"],["wA1","-1,2"],["bS1","2,0"],["wA1","3,-2"],["bG2","3,0"]],
  replies:[
   {name:"Second ant",verdict:"best",pins:"bQ1",moves:[["wA2","-1,0"],["wA2","0,-1"]],why:"The pin stays and a second free ant joins the game. These spaces touch your first hopper, so your queen stays free too."},
   {name:"Other new bug",verdict:"playable",pins:"bQ1",moves:[["wS1","-1,0"],["wS1","0,-1"],["wG2","-1,0"],["wG2","0,-1"],["wB1","-1,0"],["wB1","0,-1"]],why:"The pin stays, which is what matters. An ant adds more mobility to the attack."},
   {name:"Shift the pin to the new hopper",verdict:"weak",frees:"bQ1",moves:[["wA1","4,0"]],why:"Moving the same ant again just shifts the pin from one black bug to another and frees the black queen. This is the lost tempo of pp. 217-218."},
   {name:"Move the ant beside the queen",verdict:"weak",frees:"bQ1",moves:[["wA1","3,-1"]],why:"The ant now touches other black bugs, so the black queen is free, and you have spent a tempo moving a bug twice."}
  ],
  other:"Keep the ant where it is and bring in a new bug next to your own hive."},

 // ---- Multi-move lines. steps[] = the learner's moves in order; each step is graded like an opener's
 // replies. steps[k].then.move is the opponent's book reply, played automatically after the learner's
 // book move (not after the last step); then.alts are other opponent replies shown as notes only.
 // The line follows whichever book move the learner played; check-openers.cjs replays every path.
 {id:"z-attack-line",group:"Multi-move line",pages:"29-30, 217-219, 224-225",
  name:"Z Opening as White: ant, pin, keep going",
  summary:"Black chose the Z Opening. Play White's next three moves: bring in an ant, pin the black queen with it, then add a second ant without giving up the pin.",
  goal:"You are White. Play three moves of the Z Opening attack.",
  hint:"White's opening goals: queen early (done), attack, and immobilise the black queen as fast as possible.",
  h:[["wG1","0,0"],["bG1","1,0"],["wQ1","-1,1"],["bQ1","2,-1"]],
  other:"That move does not help the attack on the black queen.",
  steps:[
   {goal:"Move 1: bring in the bug that will attack the black queen.",
    hint:"Only one base bug can run round the hive to any space in one move.",
    other:"That bug is slower to reach the black queen than an ant.",
    replies:[
     {name:"Ant into play",verdict:"best",moves:[["wA1","-1,2"],["wA1","-2,2"],["wA1","-2,1"],["wA1","-1,0"],["wA1","0,-1"]],why:"The ant can reach any space next to the black queen on your next move. That is the quickest way to pin her."},
     {name:"Another bug first",verdict:"playable",moves:[["wS1","-1,2"],["wG2","-1,2"],["wB1","-1,2"]],why:"Developing is not wrong, but none of these bugs can reach the black queen next move. The ant can."},
     {name:"Walk the queen",verdict:"weak",moves:[["wQ1","0,1"],["wQ1","-1,0"]],why:"Moving the queen adds nothing to the hive and spends a tempo White needs for the attack."}
    ],
    then:{move:["bS1","2,0"],why:"Black adds a spider beside the queen and the first hopper. Two spaces still touch only the black queen.",
     alts:[{move:["bA1","3,-1"],why:"An ant first. It fills one pin space; two remain."},{move:["bG2","3,-2"],why:"A hopper defender next to the queen."}]}},
   {goal:"Move 2: stop the black queen from moving.",
    hint:"Find a space that touches the black queen and nothing else, and send your ant there.",
    other:"That move leaves the black queen free to move. Look for a space that touches the queen and nothing else.",
    replies:[
     {name:"Ant pins the queen",verdict:"best",pins:"bQ1",moves:[["wA1","2,-2"],["wA1","3,-2"]],why:"Your ant touches only the black queen, so she cannot move without breaking the hive. White's third opening goal is met."},
     {name:"Develop another bug",verdict:"playable",frees:"bQ1",moves:[["wA2","-2,3"],["wS1","-2,3"],["wG2","-2,3"]],why:"More bugs help later, but the black queen can still walk to safety. Pin her first."},
     {name:"Ant beside the queen, not a pin",verdict:"weak",frees:"bQ1",moves:[["wA1","1,-1"],["wA1","3,-1"]],why:"The ant also touches other bugs, so the hive stays connected without the queen. She can still slide away."}
    ],
    then:{move:["bA1","3,0"],why:"Black gets an ant into play at once, as the book advises for Black (p. 30).",
     alts:[{move:["bA1","2,1"],why:"The same idea on the other side of the spider."},{move:["bB1","3,0"],why:"A beetle that can later climb onto your pinning ant."}]}},
   {goal:"Move 3: keep the pin and add to the attack.",
    hint:"Your pinning ant is doing its job. Don't move it again; bring in a new bug instead.",
    other:"Moving the pinning ant again frees the black queen and wastes a tempo (pp. 217-218).",
    replies:[
     {name:"Second ant",verdict:"best",pins:"bQ1",moves:[["wA2","-1,0"],["wA2","0,-1"],["wA2","-1,2"],["wA2","-2,2"],["wA2","-2,1"]],why:"The pin stays and a second free ant joins the attack. Z Opening games often go to the side with the most free ants (p. 225)."},
     {name:"Other new bug",verdict:"playable",pins:"bQ1",moves:[["wS1","-1,2"],["wG2","-1,2"],["wB1","-1,2"]],why:"The pin stays, which is what matters. An ant is more mobile, so it adds more to the attack."},
     {name:"Move the pinning ant again",verdict:"weak",frees:"bQ1",moves:[["wA1","3,-1"],["wA1","1,-1"]],why:"Moving the same bug twice loses a tempo and frees the black queen. Ingersoll: don't waste tempo moving an already placed bug."},
     {name:"Walk the queen",verdict:"weak",pins:"bQ1",moves:[["wQ1","0,1"],["wQ1","-1,0"]],why:"The pin stays, but the queen move adds nothing to the attack and gives Black a free tempo."}
    ]}
  ]},

 {id:"z-defence-line",group:"Multi-move line",pages:"30-31, 219, 223-225",
  name:"Z Opening as Black: queen, defender, ant",
  summary:"White opened with a hopper and an elbow queen. Play Black's next three moves: choose the Z Opening, put a good defender next to your queen, then get an ant into play.",
  goal:"You are Black. Play three moves of a sound Black opening.",
  hint:"Black's opening goals: queen early, a good defender next to her, and ants in play quickly.",
  h:[["wG1","0,0"],["bG1","1,0"],["wQ1","-1,1"]],
  other:"That move does not follow Black's opening plan.",
  steps:[
   {goal:"Move 1: place your queen to choose the opening.",
    hint:"Your queen can go inline or in either elbow. Which side of the centre line keeps the queens apart?",
    other:"Any move that delays your queen leaves you a tempo behind. Get the queen into play now.",
    replies:[
     {name:"Z Opening",verdict:"best",type:"Z",moves:[["bQ1","2,-1"]],why:"Queens on opposite sides of the centre line. White attacks first, but Black gets good counter-attacking chances if the defence holds."},
     {name:"C Opening",verdict:"playable",type:"C",moves:[["bQ1","1,1"]],why:"Close queens make a draw more likely. A fair choice if a draw is fine for you."},
     {name:"F Opening",verdict:"weak",type:"F",moves:[["bQ1","2,0"]],why:"An inline queen against an elbow queen highly favours White."},
     {name:"Delayed queen (X Opening)",verdict:"weak",type:"X",moves:[["bA1","2,0"]],why:"For Black, a lost tempo in the opening can mean a quick loss."}
    ],
    then:{move:["wA1","-1,2"],why:"White brings in an ant to attack your queen.",
     alts:[{move:["wS1","-1,2"],why:"A spider, slower but also heading for your queen."}]}},
   {goal:"Move 2: put a good defender next to your queen.",
    hint:"The best defenders can jump or climb out of a closed space. Put one where it touches your queen and your first hopper.",
    other:"That bug does not defend your queen.",
    replies:[
     {name:"Hopper beside queen and first bug",verdict:"best",frees:"bQ1",moves:[["bG2","2,0"]],why:"A hopper can jump out later to start a counter-attack, and because it also touches your first hopper your queen can still move."},
     {name:"Beetle beside queen and first bug",verdict:"playable",frees:"bQ1",moves:[["bB1","2,0"]],why:"A beetle also defends well, but you have only two and they are your slowest attackers. This line keeps the beetle in reserve."},
     {name:"Defender on the far side",verdict:"playable",pins:"bQ1",moves:[["bG2","3,-1"],["bG2","2,-2"],["bG2","3,-2"],["bB1","3,-1"],["bB1","2,-2"],["bB1","3,-2"]],why:"A good defender, but it touches only your queen, so the queen now holds it to the hive and cannot move herself."},
     {name:"Spider as defender",verdict:"weak",moves:[["bS1","2,0"],["bS1","3,-1"],["bS1","2,-2"],["bS1","3,-2"]],why:"Spiders (and ants) make poor defenders: they are easily pinned or blocked (p. 219)."},
     {name:"Ant first",verdict:"playable",moves:[["bA1","2,0"],["bA1","1,1"],["bA1","3,-1"],["bA1","2,-2"],["bA1","3,-2"]],why:"Ants in play is part of the plan, but set up the defender first while there is room next to the queen."}
    ],
    then:{move:["wA1","3,-2"],why:"White's ant pins your queen anyway. That is normal in a Z Opening; your hopper beside her is what matters.",
     alts:[{move:["wA1","2,-2"],why:"The other space that pins your queen."},{move:["wA2","-1,0"],why:"White develops a second ant first."}]}},
   {goal:"Move 3: get an ant into play.",
    hint:"Ants are the best defenders of the whole hive. Bring one in, and keep your hopper where it is.",
    other:"Bring in an ant while your hopper stays next to the queen.",
    replies:[
     {name:"Ant into play",verdict:"best",moves:[["bA1","1,1"],["bA1","3,0"],["bA1","2,1"]],why:"A free ant can run round the hive to pin White's attackers or block an attack (p. 30)."},
     {name:"Another new bug",verdict:"playable",moves:[["bS1","3,0"],["bG3","3,0"],["bB1","3,0"]],why:"Developing is fine, but an ant gives Black the most mobility to answer White's attack."},
     {name:"Pull the defender away",verdict:"weak",moves:[["bG2","-1,0"],["bG2","2,-2"]],why:"Your hopper leaves the queen, so she loses her defender, and you spend a tempo moving a bug twice."}
    ]}
  ]},

 {id:"f-attack-line",group:"Multi-move line",pages:"29-30, 224, 226",
  name:"F Opening as White: ant, pin, second ant",
  summary:"Black answered your elbow queen with an inline queen: the F Opening, which favours White. Play White's next three moves and press the advantage.",
  goal:"You are White. Play three moves against the F Opening.",
  hint:"Pin the black queen fast, then bring in more ants. An inline queen gives Black's defenders no space inside an elbow to escape through.",
  h:[["wG1","0,0"],["bG1","1,0"],["wQ1","-1,1"],["bQ1","2,0"]],
  other:"That move does not press White's advantage.",
  steps:[
   {goal:"Move 1: bring in the bug that will attack the black queen.",
    hint:"Only one base bug can run round the hive to any space in one move.",
    other:"That bug is slower to reach the black queen than an ant.",
    replies:[
     {name:"Ant into play",verdict:"best",moves:[["wA1","-1,2"],["wA1","-2,2"],["wA1","-2,1"],["wA1","-1,0"],["wA1","0,-1"]],why:"The ant can reach a space that pins the black queen on your next move."},
     {name:"Another bug first",verdict:"playable",moves:[["wS1","-1,2"],["wG2","-1,2"],["wB1","-1,2"]],why:"None of these can reach the black queen next move. The ant can."},
     {name:"Walk the queen",verdict:"weak",moves:[["wQ1","0,1"],["wQ1","-1,0"]],why:"A queen move adds nothing and spends the tempo your attack needs."}
    ],
    then:{move:["bS1","2,-1"],why:"Black adds a spider beside the queen. In the book's F Opening example Black's defenders are a spider and an ant, neither of them good defenders.",
     alts:[{move:["bA1","2,-1"],why:"An ant in the same place."},{move:["bG2","3,0"],why:"A hopper defender, the better choice for Black."}]}},
   {goal:"Move 2: stop the black queen from moving.",
    hint:"Find a space that touches the black queen and nothing else.",
    other:"That move leaves the black queen free to move. Look for a space that touches the queen and nothing else.",
    replies:[
     {name:"Ant pins the queen",verdict:"best",pins:"bQ1",moves:[["wA1","3,0"],["wA1","2,1"]],why:"Your ant touches only the black queen, so she cannot move."},
     {name:"Ant beside the queen, not a pin",verdict:"weak",frees:"bQ1",moves:[["wA1","1,1"],["wA1","3,-1"]],why:"The ant also touches another black bug, so the queen can still slide away."},
     {name:"Develop another bug",verdict:"playable",frees:"bQ1",moves:[["wA2","-2,3"],["wS1","-2,3"]],why:"Useful later, but the black queen is still free. Pin her first."}
    ],
    then:{move:["bA1","3,-2"],why:"Black brings in an ant behind the spider.",
     alts:[{move:["bG2","3,-2"],why:"A hopper behind the spider."}]}},
   {goal:"Move 3: keep the pin and bring in more force.",
    hint:"Ingersoll: once White's ants enter the game, Black is in serious trouble. Leave the pinning ant where it is.",
    other:"Moving the pinning ant again frees the black queen and wastes a tempo.",
    replies:[
     {name:"Second ant",verdict:"best",pins:"bQ1",moves:[["wA2","-1,0"],["wA2","0,-1"],["wA2","-1,2"],["wA2","-2,2"],["wA2","-2,1"]],why:"The pin stays and a second ant joins. Black's spider and ant cannot hold for long (p. 226)."},
     {name:"Other new bug",verdict:"playable",pins:"bQ1",moves:[["wS1","-1,2"],["wG2","-1,2"],["wB1","-1,2"]],why:"The pin stays. An ant adds more mobility to the attack."},
     {name:"Move the pinning ant again",verdict:"weak",frees:"bQ1",moves:[["wA1","1,1"],["wA1","3,-1"]],why:"You free the black queen and lose a tempo by moving the same bug twice (pp. 217-218)."}
    ]}
  ]}
];
if(typeof module!=="undefined") module.exports=Openers;
