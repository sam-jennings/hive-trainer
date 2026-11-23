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
// ---- Branching lines (OPENERS-BRANCHING-NOTES.md). A step's then may hold branches[] instead of
// move: the computer plays one branch's move (the screen picks a branch not solved yet), and the line
// continues with that branch's own steps[] (2+ learner moves each). A branching step is the last of
// its steps[]. check-openers.cjs replays every branch path. Shared replies are reused from the lines
// above so the grading stays identical where the position is the same.
{
 const line = id => Openers.find(x => x.id === id).steps;
 const zA = line("z-attack-line"), zD = line("z-defence-line"), fA = line("f-attack-line");
 const wl = Openers.find(x => x.id === "white-last"), xa = Openers.find(x => x.id === "x-answer");
 const secondAnt = (pin, extra) => ({goal:"Move 3: keep the pin and add to the attack.",
  hint:"Your pinning ant is doing its job. Don't move it again; bring in a new bug instead.",
  other:"Moving the pinning ant again frees the black queen and wastes a tempo (pp. 217-218).",
  replies:[
   {name:"Second ant",verdict:"best",pins:pin,moves:[["wA2","-1,0"],["wA2","0,-1"],["wA2","-1,2"],["wA2","-2,2"],["wA2","-2,1"]],why:"The pin stays and a second free ant joins the attack. Z Opening games often go to the side with the most free ants (p. 225)."},
   {name:"Other new bug",verdict:"playable",pins:pin,moves:[["wS1","-1,2"],["wG2","-1,2"],["wB1","-1,2"]],why:"The pin stays, which is what matters. An ant is more mobile, so it adds more to the attack."},
   {name:"Move the pinning ant again",verdict:"weak",frees:"bQ1",moves:extra,why:"Moving the same bug twice loses a tempo and frees the black queen (pp. 217-218)."}]});
 Openers.push(
 {id:"z-attack-branch",group:"Branching line",pages:"29-30, 217-219, 225",
  name:"Z Opening as White: answer Black's defender",
  summary:"Black chose the Z Opening. Bring in your ant; Black then answers in one of three ways, and your pin depends on which.",
  goal:"You are White. Play three moves of the Z Opening attack against Black's reply.",
  hint:"White's opening goal: immobilise the black queen as fast as possible, and keep your ants free.",
  h:[["wG1","0,0"],["bG1","1,0"],["wQ1","-1,1"],["bQ1","2,-1"]],
  other:"That move does not help the attack on the black queen.",
  steps:[
   {goal:"Move 1: bring in the bug that will attack the black queen.",hint:zA[0].hint,other:zA[0].other,replies:zA[0].replies,
    then:{branches:[
     {name:"Spider beside queen and hopper",move:["bS1","2,0"],why:"Black's spider touches the queen and the first hopper. Two spaces still touch only the black queen.",
      steps:[zA[1],secondAnt("bQ1",[["wA1","3,-1"],["wA1","1,-1"]])]},
     {name:"Ant on the far side of the queen",move:["bA1","3,-1"],why:"Black's ant touches only the queen, so Black has pinned her own queen: she cannot move without cutting the ant off. The ant itself is free.",
      steps:[
       {goal:"Move 2: the black queen is already stuck. Deal with Black's free ant.",
        hint:"A bug that touches only Black's ant pins it, and the queen stays stuck as long as the ant hangs on her.",
        other:"Black's ant is still free to run round the hive.",
        replies:[
         {name:"Pin Black's ant",verdict:"best",pins:["bQ1","bA1"],moves:[["wA1","4,-1"],["wA1","3,0"],["wA1","4,-2"]],why:"Your ant touches only Black's ant, so neither the ant nor the queen can move. Black is left with no free ant (p. 225: free ants decide Z Openings)."},
         {name:"Second ant first",verdict:"playable",pins:"bQ1",frees:"bA1",moves:[["wA2","-1,0"],["wA2","0,-1"],["wA2","-2,2"],["wA2","-2,1"]],why:"The queen stays stuck, but Black's ant is free to pin one of your attackers."},
         {name:"Pin the queen as well",verdict:"weak",pins:"bQ1",frees:"bA1",moves:[["wA1","2,-2"],["wA1","3,-2"]],why:"The queen is already stuck, so this spends the move on nothing new and leaves Black's ant free."},
         {name:"Ant beside queen and first hopper",verdict:"weak",frees:"bQ1",moves:[["wA1","2,0"]],why:"This space links Black's ant to the rest of the hive, so the black queen is free again."}],
        then:{move:["bS1","1,1"],why:"Black adds a spider on the far side of the first hopper."}},
       {goal:"Move 3: keep both pins and add to the attack.",
        hint:"Both black bugs are held by your one ant. Leave it there and bring in a new bug.",
        other:"Moving the pinning ant again frees Black's ant and wastes a tempo.",
        replies:[
         {name:"Second ant",verdict:"best",pins:["bQ1","bA1"],moves:[["wA2","-1,0"],["wA2","0,-1"],["wA2","-1,2"],["wA2","-2,2"],["wA2","-2,1"]],why:"Both pins stay and a second free ant joins the attack."},
         {name:"Other new bug",verdict:"playable",pins:["bQ1","bA1"],moves:[["wS1","-1,2"],["wG2","-1,2"],["wB1","-1,2"]],why:"Both pins stay. An ant would add more mobility."},
         {name:"Move the pinning ant again",verdict:"weak",frees:"bQ1",moves:[["wA1","2,0"]],why:"Your ant now links Black's ant to the hive, so the queen and the ant are both free, and you moved the same bug twice."}]}]},
     {name:"Spider behind the first hopper",move:["bS1","1,1"],why:"Black's spider touches only the first hopper, so all three of the queen's open sides away from it touch nothing else.",
      steps:[
       {goal:"Move 2: stop the black queen from moving.",
        hint:"Find a space that touches the black queen and nothing else. There are more of them now than in the spider-beside-queen branch.",
        other:"That move leaves the black queen free to move. Look for a space that touches the queen and nothing else.",
        replies:[
         {name:"Ant pins the queen",verdict:"best",pins:"bQ1",moves:[["wA1","3,-1"],["wA1","2,-2"],["wA1","3,-2"]],why:"Your ant touches only the black queen, so she cannot move. With the spider away from her, (3,-1) pins too."},
         {name:"Develop another bug",verdict:"playable",frees:"bQ1",moves:[["wA2","-2,3"],["wS1","-2,3"],["wG2","-2,3"]],why:"More bugs help later, but the black queen can still walk to safety. Pin her first."},
         {name:"Ant beside queen and hopper",verdict:"weak",frees:"bQ1",moves:[["wA1","2,0"],["wA1","1,-1"]],why:"The ant also touches other bugs, so the hive stays connected without the queen. She can still slide away."}],
        then:{move:["bA1","2,1"],why:"Black gets an ant into play behind the spider (p. 30)."}},
       secondAnt("bQ1",[["wA1","2,0"],["wA1","1,-1"]])]}]}}
  ]},

 {id:"f-attack-branch",group:"Branching line",pages:"29-30, 224, 226",
  name:"F Opening as White: pin whichever side is open",
  summary:"Black answered your elbow queen with an inline queen (F Opening). After your ant comes in, Black covers one side of the queen, and the pinning space depends on which.",
  goal:"You are White. Play three moves against the F Opening.",
  hint:"Pin the black queen fast, then bring in more ants.",
  h:[["wG1","0,0"],["bG1","1,0"],["wQ1","-1,1"],["bQ1","2,0"]],
  other:"That move does not press White's advantage.",
  steps:[
   {goal:"Move 1: bring in the bug that will attack the black queen.",hint:fA[0].hint,other:fA[0].other,replies:fA[0].replies,
    then:{branches:[
     {name:"Spider in the upper elbow",move:["bS1","2,-1"],why:"Black adds a spider beside the queen, as in the book's F Opening example (spider and ant defenders).",
      steps:[fA[1],fA[2]]},
     {name:"Ant in the lower elbow",move:["bA1","1,1"],why:"Black's ant touches the queen and the first hopper on the lower side, so the open pinning spaces move.",
      steps:[
       {goal:"Move 2: stop the black queen from moving.",
        hint:"Black's ant covers the lower side. Find a space that touches the black queen and nothing else.",
        other:"That move leaves the black queen free to move. Look for a space that touches the queen and nothing else.",
        replies:[
         {name:"Ant pins the queen",verdict:"best",pins:"bQ1",moves:[["wA1","3,0"],["wA1","3,-1"]],why:"Your ant touches only the black queen, so she cannot move. (2,1) no longer pins in this branch, because Black's ant touches it."},
         {name:"Ant beside the queen, not a pin",verdict:"weak",frees:"bQ1",moves:[["wA1","2,1"],["wA1","2,-1"]],why:"The ant also touches another black bug, so the queen can still slide away."},
         {name:"Develop another bug",verdict:"playable",frees:"bQ1",moves:[["wA2","-2,3"],["wS1","-2,3"]],why:"Useful later, but the black queen is still free. Pin her first."}],
        then:{move:["bS1","1,2"],why:"Black adds a spider behind the ant."}},
       {goal:"Move 3: keep the pin and bring in more force.",hint:fA[2].hint,other:fA[2].other,
        replies:[fA[2].replies[0],fA[2].replies[1],
         {name:"Move the pinning ant again",verdict:"weak",frees:"bQ1",moves:[["wA1","2,1"],["wA1","2,-1"]],why:"You free the black queen and lose a tempo by moving the same bug twice (pp. 217-218)."}]}]}]}}
  ]},

 {id:"white-last-branch",group:"Branching line",pages:"29-30, 58, 217-218, 223-225",
  name:"White places the queen last: Z, then pin",
  summary:"Black placed the queen first, in the lower elbow. Choose the Z Opening, then pin the black queen with the ant you already have in play. Where the pin goes depends on Black's reply.",
  goal:"You are White. Choose the opening, then attack the black queen.",
  hint:"White wants an open game: queens on opposite sides of the centre line, then a fast pin.",
  h:[["wG1","0,0"],["bG1","1,0"],["wA1","-1,0"],["bQ1","1,1"]],
  other:"That move gives away White's opening initiative.",
  steps:[
   {goal:"Move 1: place your queen to choose the opening.",hint:wl.hint,other:wl.other,replies:wl.replies,
    then:{branches:[
     {name:"Spider beside queen and hopper",move:["bS1","2,0"],why:"Black's spider touches the queen and the first hopper.",
      steps:[
       {goal:"Move 2: your ant can move now. Pin the black queen.",
        hint:"Find a space that touches the black queen and nothing else.",
        other:"That move leaves the black queen free to move.",
        replies:[
         {name:"Ant pins the queen",verdict:"best",pins:"bQ1",moves:[["wA1","0,2"],["wA1","1,2"]],why:"Your ant touches only the black queen, so she cannot move."},
         {name:"Ant beside the queen, not a pin",verdict:"weak",frees:"bQ1",moves:[["wA1","2,1"],["wA1","0,1"]],why:"The ant also touches the spider or the first bugs, so the queen can still slide away."},
         {name:"Develop another bug",verdict:"playable",frees:"bQ1",moves:[["wA2","-1,-1"],["wS1","-1,-1"]],why:"More bugs help later, but the black queen is still free. Pin her first."}],
        then:{move:["bA1","3,0"],why:"Black brings an ant into play behind the spider (p. 30)."}},
       {goal:"Move 3: keep the pin and add to the attack.",
        hint:"Your pinning ant is doing its job. Bring in a new bug.",
        other:"Moving the pinning ant again frees the black queen and wastes a tempo (pp. 217-218).",
        replies:[
         {name:"Second ant",verdict:"best",pins:"bQ1",moves:[["wA2","-1,0"],["wA2","-1,-1"],["wA2","0,-2"],["wA2","1,-2"],["wA2","-1,1"]],why:"The pin stays and a second free ant joins the attack (p. 225)."},
         {name:"Other new bug",verdict:"playable",pins:"bQ1",moves:[["wS1","-1,0"],["wG2","-1,0"],["wB1","-1,0"]],why:"The pin stays. An ant adds more mobility."},
         {name:"Move the pinning ant again",verdict:"weak",frees:"bQ1",moves:[["wA1","2,1"],["wA1","0,1"]],why:"You free the black queen and move the same bug twice."}]}]},
     {name:"Spider beside the first hopper only",move:["bS1","2,-1"],why:"Black's spider touches only the first hopper. The queen's side at (2,1) now touches nothing but her.",
      steps:[
       {goal:"Move 2: your ant can move now. Pin the black queen.",
        hint:"Find a space that touches the black queen and nothing else. There is one more than when the spider sits beside her.",
        other:"That move leaves the black queen free to move.",
        replies:[
         {name:"Ant pins the queen",verdict:"best",pins:"bQ1",moves:[["wA1","2,1"],["wA1","1,2"],["wA1","0,2"]],why:"Your ant touches only the black queen, so she cannot move. (2,1) works here because no black bug is next to it."},
         {name:"Ant beside the queen, not a pin",verdict:"weak",frees:"bQ1",moves:[["wA1","2,0"],["wA1","0,1"]],why:"The ant also touches other bugs, so the queen can still slide away."},
         {name:"Develop another bug",verdict:"playable",frees:"bQ1",moves:[["wA2","-1,-1"],["wS1","-1,-1"]],why:"More bugs help later, but the black queen is still free. Pin her first."}],
        then:{move:["bA1","3,-1"],why:"Black brings an ant into play behind the spider (p. 30)."}},
       {goal:"Move 3: keep the pin and add to the attack.",
        hint:"Your pinning ant is doing its job. Bring in a new bug.",
        other:"Moving the pinning ant again frees the black queen and wastes a tempo (pp. 217-218).",
        replies:[
         {name:"Second ant",verdict:"best",pins:"bQ1",moves:[["wA2","-1,0"],["wA2","-1,-1"],["wA2","0,-2"],["wA2","1,-2"],["wA2","-1,1"]],why:"The pin stays and a second free ant joins the attack (p. 225)."},
         {name:"Other new bug",verdict:"playable",pins:"bQ1",moves:[["wS1","-1,0"],["wG2","-1,0"],["wB1","-1,0"]],why:"The pin stays. An ant adds more mobility."},
         {name:"Move the pinning ant again",verdict:"weak",frees:"bQ1",moves:[["wA1","2,0"],["wA1","0,1"]],why:"You free the black queen and move the same bug twice."}]}]}]}}
  ]},

 {id:"x-answer-branch",group:"Branching line",pages:"29-31, 219, 224, 227",
  name:"Answering an X Opening: queen, then react",
  summary:"White opened with a hopper and an ant and held the queen back. Get your queen in, then answer whatever White does next.",
  goal:"You are Black. Punish White's delayed queen.",
  hint:"White's bugs cannot move until the white queen is down. Use the time.",
  h:[["wG1","0,0"],["bG1","1,0"],["wA1","-1,0"]],
  other:"That move does not use White's lost tempo.",
  steps:[
   {goal:"Move 1: answer White's delayed queen.",hint:xa.hint,other:xa.other,replies:xa.replies,
    then:{branches:[
     {name:"White places the queen",move:["wQ1","-1,1"],why:"White gets the queen in at last, beside the hopper and the ant.",
      steps:[
       {goal:"Move 2: put a good defender next to your queen.",
        hint:"The best defenders can jump or climb out of a closed space. Put one where it touches your queen and your first hopper.",
        other:"That bug does not defend your queen.",
        replies:[
         {name:"Hopper beside queen and first bug",verdict:"best",frees:"bQ1",moves:[["bG2","2,0"]],why:"A hopper can jump out later to counter-attack, and because it also touches your first hopper your queen stays mobile (p. 30)."},
         {name:"Beetle beside queen and first bug",verdict:"playable",frees:"bQ1",moves:[["bB1","2,0"]],why:"A beetle also defends well, but you have only two and they are slow attackers."},
         {name:"Spider as defender",verdict:"weak",moves:[["bS1","2,0"]],why:"Spiders make poor defenders: they are easily pinned or blocked (p. 219)."},
         {name:"Ant first",verdict:"playable",moves:[["bA1","2,0"],["bA1","2,1"],["bA1","1,2"],["bA1","3,-1"],["bA1","2,-2"]],why:"Ants in play is part of the plan, but set up the defender while there is room next to the queen."}],
        then:{move:["wS1","-2,1"],why:"White adds a spider beside the ant."}},
       {goal:"Move 3: get an ant into play.",
        hint:"Ants are the best defenders of the whole hive. Bring one in and keep your hopper where it is.",
        other:"Bring in an ant while your hopper stays next to the queen.",
        replies:[
         {name:"Ant into play",verdict:"best",moves:[["bA1","1,1"],["bA1","1,2"],["bA1","2,1"],["bA1","3,0"],["bA1","3,-1"],["bA1","2,-1"],["bA1","2,-2"],["bA1","3,-2"]],why:"A free ant can run round the hive to pin White's attackers or block an attack (p. 30)."},
         {name:"Another new bug",verdict:"playable",moves:[["bS1","3,0"],["bB1","3,0"]],why:"Developing is fine, but an ant gives Black the most mobility."},
         {name:"Pull the defender away",verdict:"weak",moves:[["bG2","-2,0"]],why:"Your hopper leaves the queen without a defender, and you spend a tempo moving a bug twice."}]}]},
     {name:"White delays the queen again",move:["wS1","-2,1"],why:"White holds the queen back once more. The rules force White to place it next turn, and until then no white bug can move.",
      steps:[
       {goal:"Move 2: White's bugs still cannot move. Bring in your fastest bug.",
        hint:"Which bug could reach any space next to White's queen once she arrives?",
        other:"That bug is slower than an ant.",
        replies:[
         {name:"Ant into play",verdict:"best",moves:[["bA1","2,0"],["bA1","2,-1"],["bA1","2,1"],["bA1","1,2"],["bA1","0,2"],["bA1","1,1"],["bA1","3,-1"],["bA1","2,-2"],["bA1","3,-2"]],why:"Your queen is down, so your ant is free from the next move on. White gets no free bug until the queen arrives (p. 227)."},
         {name:"Defender first",verdict:"playable",moves:[["bG2","2,0"]],why:"A sound defender, but White cannot attack yet. An ant uses the tempo White gave you."},
         {name:"Spider",verdict:"weak",moves:[["bS1","2,0"]],why:"A spider is slow, and spiders make poor defenders (p. 219)."}],
        then:{move:["wQ1","-1,1"],why:"White must place the queen on turn four. She touches the hopper, the ant and the spider."}},
       {goal:"Move 3: use your free ant against White's new queen.",
        hint:"A bug that touches only the white queen pins her.",
        other:"That move leaves the white queen free to move.",
        replies:[
         {name:"Ant pins the white queen",verdict:"best",pins:"wQ1",moves:[["bA1","-1,2"]],why:"Your ant touches only the white queen, so she cannot move. White's lost tempi have handed Black the first pin."},
         {name:"Ant beside the queen, not a pin",verdict:"weak",frees:"wQ1",moves:[["bA1","-2,2"],["bA1","0,1"]],why:"The ant also touches other bugs, so the white queen can still move."},
         {name:"Defender next to your queen",verdict:"playable",moves:[["bG2","2,0"],["bG2","3,-1"],["bG2","2,1"]],why:"Solid, but your free ant can do more right now."}]}]}]}}
  ]},

 {id:"z-defence-branch",group:"Branching line",pages:"30-31, 219, 223-225",
  name:"Z Opening as Black: defend from either side",
  summary:"White opened with a hopper and an elbow queen. Choose the Z Opening; White's ant then comes in from below or from above, and your last move depends on where it ends up.",
  goal:"You are Black. Play three moves of a sound Black opening.",
  hint:"Black's opening goals: queen early, a good defender next to her, and ants in play quickly.",
  h:[["wG1","0,0"],["bG1","1,0"],["wQ1","-1,1"]],
  other:"That move does not follow Black's opening plan.",
  steps:[
   {goal:zD[0].goal,hint:zD[0].hint,other:zD[0].other,replies:zD[0].replies,
    then:{branches:[
     {name:"Ant from below",move:["wA1","-1,2"],why:"White brings in an ant below the queen to attack yours.",
      steps:[zD[1],zD[2]]},
     {name:"Ant from above",move:["wA1","0,-1"],why:"White's ant comes in on the top side, nearer your queen.",
      steps:[
       {goal:zD[1].goal,hint:zD[1].hint,other:zD[1].other,replies:zD[1].replies,
        then:{move:["wA1","2,-2"],why:"White's ant pins your queen from the top side. That is normal in a Z Opening; your hopper beside her is what matters."}},
       {goal:"Move 3: get an ant into play.",
        hint:"Ants are the best defenders of the whole hive. Bring one in and keep your hopper where it is. White's ant sits on a different side this time.",
        other:"Bring in an ant while your hopper stays next to the queen.",
        replies:[
         {name:"Ant into play",verdict:"best",moves:[["bA1","1,1"],["bA1","3,0"],["bA1","2,1"],["bA1","3,-1"]],why:"A free ant can run round the hive to pin White's attackers or block an attack (p. 30). With White's ant at (2,-2), (3,-1) is open to you too."},
         {name:"Another new bug",verdict:"playable",moves:[["bS1","3,0"],["bG3","3,0"],["bB1","3,0"]],why:"Developing is fine, but an ant gives Black the most mobility to answer White's attack."},
         {name:"Pull the defender away",verdict:"weak",moves:[["bG2","-1,0"]],why:"Your hopper leaves the queen, so she loses her defender, and you spend a tempo moving a bug twice."}]}]}]}}
  ]});
}
if(typeof module!=="undefined") module.exports=Openers;
