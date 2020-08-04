//create svg canvas space with set width and height
var width = 1200;
var height = 900;

var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
//I will add proper centering in the future
//maybe add new cursor
    
//read dataset file
d3.csv("MetaCriticFullDataset.csv").then(function(data){
    //prototype- next step use beautiful soup to get info from metacritic.
    
    console.log(data);
    //since metacritic lists their games from highest to lowest score
    //the data is too neat so the circles look too 'clean' and boring so i shuffle
    //it around to make it look more 'bubbly' 
    //https://javascript.info/task/shuffle
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    shuffle(data)
    ////newer metacritic data set parsing code //////
    
    //create list where the games where 'nested' in console categories
    var nestObj = d3.nest().key(function(d){return d[" platform"]; }).entries(data);
    
    console.log(nestObj);
    //need to rename values to children for it to be read by d3.hierarchy, there's probably
    //an easier, shorter way to do this...
    var arr = [];
    nestObj.forEach(function(d){
        var obj = {
            children: d.values,
            Platform: d.key
        }
        arr.push(obj);
    }); 
    console.log(arr);
    //set the root of the tree hierarchy to point at the array of consoles
    var root = {children: arr};
    //create tree structure where the node values proportional to their number of children(console nodes)
    //or set it proportional to its critic score(game nodes)
    var ConsoleHeirarchy = d3.hierarchy(root).sum(function(d){
        if( typeof d.children !== 'undefined') return d.value;
        return Math.pow((+d[" score"])/10, 2);
    });
    console.log(ConsoleHeirarchy);
    
    ////////////////
    
    //use d3 pack on the tree and pack it into our svg canvas
    //pack will assign a radius based on the node value which we defined before
    var pack = d3.pack().size([width - 200, height]).padding(3);
    
    var packedConsoles = pack(ConsoleHeirarchy);
    console.log(packedConsoles);
    
    
    var AllNodes = d3.nest().entries(packedConsoles.descendants());
    console.log(AllNodes);
    var OnlyConsoles = AllNodes.filter(function(d){
        return d.height >= 1;
    });
    var OnlyGames = AllNodes.filter(function(d){
        return d.height == 0;
    });
    
    var GamesArr = d3.nest().key(function(d) {
        return d.data[" platform"]; 
    }).entries(OnlyGames);
    
    console.log(GamesArr);
    //Only draw the consoles initially
    var leaf = svg.selectAll(".leaf")
        .data(OnlyConsoles)
        .enter().append("g")
        .attr("transform", function(d){
            //console.log(d);
            return "translate("+(d.x+1.0)+","+(d.y+1.0)+")"
        });
    var ConsoleCircles = d3.selectAll("#I1")
    //draw console circles
    
    var circle = leaf.append("circle")
        .attr("id", function(d){
            //if(d.height == 0) return 'I'+d.height+d.data["Platform"];
            return 'I'+d.height;
        })
        .attr("r", function(d){return d.r;})
        
        .attr("fill", function(d){
            if(d.height == 2) return "#995588";
            if(d.height == 1) return "#bbffcc";
            if(d.height == 0) return "#ff7788";
        })
        .attr("visibility", function(d){
            //if(d.height == 0) return "hidden";
            return "visible";
        })
        .attr("pointer-events", function(d){
            if(d.height != 1) return "none";
        })
        .style("cursor", "pointer");
    
    //Function for drawing new circles when a console circle is selected
    var oldleaf = null;
    function update(x){
        //console node is passed
        //newleaf binds new data to leaf class
        //newleafGroups is an enter selection for new elements to be added
        var newleaf = svg.selectAll(".leaf").data(x);
        var newleafGroups = newleaf.enter().append("g").attr("transform", function(d){
            //console.log(d);
            return "translate("+(d.x+1.0)+","+(d.y+1.0)+")"
        });
        //for every new element draw a new circle
        newleafGroups.append("circle")
        .attr("id", function(d){
            //if(d.height == 0) return 'I'+d.height+d.data["Platform"];
            return 'I'+d.height;
        })
        .transition().duration(2000)
        .attr("r", function(d){return d.r;})
        //.transition().duration(2000)
        .attr("fill", function(d){
            if(d.height == 2) return "#995588";
            if(d.height == 1) return "#bbffcc";
            if(d.height == 0) return "#ff7788";
        })
        .attr("visibility", function(d){
            //if(d.height == 0) return "hidden";
            return "visible";
        })
        .style("cursor", "pointer");
        //to remove circles when new console is selected
        oldleaf = newleafGroups;
        //leaf.remove();
        

        console.log(svg.node());
    }

    var games = d3.selectAll("#I1");//actually refers to console circles
    var games1 = d3.selectAll("#I0");//refers to all drawn games circles
 
    
    //*space marine game doesnt work

    var Game_Name_text = svg.append("text")
        .attr("x", width - 400)
        .attr("y", 50)
        .text("");
    
    var Critic_Score_text = svg.append("text")
        .attr("x", width - 400)
        .attr("y", 70)
        .text("");
    
    //add a group tag for storing images
    var Images = svg.append("g");
    var last_img = null;
    //pass game node to function
    //then add an image element to the html
    //the game node data already has the image url to be used for the link source
function appendImage(game){
    //console.log(game[" image_url"]);
    var src = game[" image_url"];
    last_img = Images.append("image")
    //.attr("id", d.basename)
    .attr("x", width - 300)
    .attr("y", 90)
    .attr("width", 100)
    .attr("height", 100)
    .attr("xlink:href",src)
    .attr("visibility", "visible"); 

}

    var lastSelection = null;
    var lastImage = null;
    var lastConsoleGames = null;
    var lastGame = null;
    
    ////////// copied code //////////
    //also ugliest part of my code//
    //http://bl.ocks.org/nbremer/667e4df76848e72f250b
    //a good chunk of it was not altered but a good chunk was added/altered as well
    var lastTrans = {v0: null, v1: null};
    var lastR = null;
    var focus = null;
    var lastK = null;
    //zooms into selected circle
    //altered code so it zooms in differently
    //instead it centers the selected circle and enlarges it while
    //moving all other circles to a proportional distance to it so it gives the illusion that it zooms in on it
function zoomToCanvas(dd) {
    focus = dd;
    var v = [focus.x, focus.y, focus.r * 3.05],
        k = width / v[2];
        //for a better view experience, center the selected circle
        //to the middle of the screen
        var t1 = (dd.parent.x - dd.x+1.0);
        var t2 = (dd.parent.y - dd.y+1.0);
    games//console circles. should change the name...
        .transition().duration(2000)
        .attr("transform", function(d){
            var a1 = d.x - v[0];//x unit distance between other circle and centered circle
            var a2 = d.y - v[1];// same as above but y unit distance
            var b1 = d.parent.x - d.x + 1.0;//to center other circle
            var b2 = d.parent.y - d.y + 1.0;
            //For all other circles, center it first, then move it the origianl units in the
            //x and y direction to move it with respect to the centered circle.
            //multiply by k to push them away as they the radius will get bigger by k, so they dont overlap
            if(d != focus) return "translate("+(b1+(a1*k))+","+(b2+(a2*k))+")";
            else return "translate("+(t1)+","+(t2)+")";//move selected circle to center
        })
        .attr("r", function(d) { return d.r * k ; });//scale radius by k
    //scale big purple circle    
    rootCircle
        .transition().duration(2000)
        .attr("transform", function(d){
        return "translate("+((d.x+1.0-v[0])*k)+","+((d.y+1.0-v[1])*k)+")";
        })
        .attr("r", function(d) { return d.r * k * 1.2  ; });

    d3.selectAll("#I0")
        .transition().duration(2000)
        .attr("transform", function(d){
            var a1 = d.x - v[0];
            var a2 = d.y - v[1];
            var b1 = d.parent.x - d.x + 1.0;
            var b2 = d.parent.y - d.y + 1.0;
            //for all sub circles of center circle, do the same as other circles,
            //but then apply the same transformation as the center circle.
            return "translate("+(b1+(a1*k)+t1)+","+(b2+(a2*k)+t2)+")";
        })
        .attr("r", function(d) { return d.r * k ; });
}
    ////////////////////////////////
    
    console.log(svg.node());
    var rootCircle = d3.selectAll("#I2");
    var ConsolesGames = null;
    var GlobalSelection = null;
    var zoomed = false;
    circle.on("click", function(d){
        //drawGames(d.children)
        //update(PS3Nodes);
        console.log(d);
        console.log(d.data["Platform"]);
        //console.log(GamesArr.find(function(obj){return obj.key == d.data["Platform"];}))
        var GameNodes = GamesArr.find(function(obj){return obj.key == d.data["Platform"];}).values;
        //console.log(GameNodes);
        //update(GameNodes);
        var Selection = d3.select(this);
        GlobalSelection = Selection;
        //turn off pointer events for ALL circles. Then enable it for THIS circle.
        games.attr("pointer-events", "none"); // cant zoom into other circles while already zoomed in
        Selection.attr("pointer-events", "auto");// only can zoom out by clicking current circle
        //console.log(lastK);
        console.log(svg.node());
        //console.log(d.data);
        //console.log(d3.nest().entries(packedData.descendants())[0]);
        if(focus !== d){
            update(GameNodes);
            //d3.selectAll("#I0").attr("opacity", 0);
            zoomToCanvas(d);
            d3.selectAll("#I0").attr("pointer-events", "auto");
            zoomed = true;
        }
        else {
            //oldleaf.remove();
            
            lastGameMouseOver.attr("stroke", "none");
            d3.selectAll("#I0").attr("pointer-events", "none");
            games
				.transition().duration(2000)
				    .attr("transform","translate(0,0)")
					.attr("r", function(d) { return d.r; });
            d3.selectAll("#I0")
				.transition().duration(2000)
				    .attr("transform","translate(0,0)")
					.attr("r", 0);
            rootCircle
                .transition().duration(2000)
				    .attr("transform", "translate(0,0)")
					.attr("r", function(d) { return d.r; })

            games.attr("pointer-events", "auto");
            oldleaf.transition().delay(2000).remove();
            focus = null;//reset focus. Otherwise i can re-select the same thing.
            //later on i will need another way to reset, in case i want to enlarge individual game circles
            zoomed = false;
        }
        //appendImage(d.children);
        reset();
        ConsolesGames = d3.selectAll('#I0');
        console.log(ConsolesGames);

        ConsolesGames.attr("visibility", "visible")
            //.attr("pointer-events", "auto")
            .on("mouseover", mouseOverFunc)
            .on("click", ConsolesGamesClicked);
        

        Selection.attr("fill", "#bbffff");

        Game_Name_text.text("Platform: "+d.data["Platform"]);

        lastConsoleGames = ConsolesGames;
        lastSelection = Selection;
    });
    
    lastConsoleMouseOver = null;
    circle.on("mouseover", function(d){
        var ConsoleSelection = d3.select(this);
        lastConsoleMouseOver = ConsoleSelection;
        if(!zoomed){
            ConsoleSelection.attr("stroke", "#000")
            .attr("stroke-width", 2);
            Game_Name_text.text("Platform: "+d.data["Platform"]);
        }
    });
    
    circle.on("mouseout", function(d){
        lastConsoleMouseOver.attr("stroke", "none");
        if(!zoomed) Game_Name_text.text("");
    });
    
    function ConsolesGamesClicked(d){
        console.log(d);
        resetGame();
        appendImage(d.data);
        var Selection = d3.select(this);
        Selection.attr("fill", "#11aaff"); 
        Game_Name_text.text("Name: "+d.data.name);
        Critic_Score_text.text("Critic Score: "+d.data[" score"]);
        lastGame = Selection;
    }
    function resetGame(){
        if(lastGame != null){
            lastGame.attr("fill", "#ff7788");
            //or Image.select("image").remove() should work too
            d3.selectAll("image").remove();
        }
    }
    function reset(){
        if(lastSelection != null){
            lastSelection.attr("fill", "#bbffcc");
            lastConsoleGames.attr("visibility", "hidden");
            lastSelection.attr("pointer-events", "auto");
            Critic_Score_text.text("");
            resetGame();
        }
    }
    var lastGameMouseOver = null;
    function mouseOverFunc(){

        var selection = d3.select(this);
        selection.attr("stroke", "#000");
        selection.attr("stroke-width", 2);
        if(lastGameMouseOver != null && (selection != lastGameMouseOver)){
            lastGameMouseOver.attr("stroke", "none");
        }
        lastGameMouseOver = selection;
        
    }
    //future ideas:
    //make a few big main bubbles for different consoles
    //when you click on one, it enlarges it and draws more bubbles inside of it to represent years
    //then click on a year to look at all games for that console that year.
    //the bubble size will be proportional to the review.
});