//create svg canvas space with set width and height
var width = 1200;
var height = 900;

var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", "translate(200, 0)");

//I will add proper centering in the future
//maybe add new cursor
function rowConverter(d){
    return {
        "name": d.name,
        " score": d[" score"],
        " platform": d[" platform"],
        " desc": d[" desc"],
        " date": d[" date"],
        "year": d[" date"].slice(d[" date"].length-4,d[" date"].length),
        " image_url": d[" image_url"]
        
    }
}    
//read dataset file
d3.csv("MetaCriticFullDataset.csv").then(function(data){
    
    
    //console.log(data);
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
    shuffle(data);
    
    ////newer metacritic data set parsing code //////
    //nest data structure to show games by year
    //slice used to get year of date, since date is in form Month day Year i just get last 4 characters
    var YearsNest = d3.nest()
    .key(function(d){return d[" platform"]; })
    .key(function(d){return d[" date"].slice(d[" date"].length-4,d[" date"].length); }).entries(data);
    

    //create list where the games where 'nested' in console categories
    var nestObj = d3.nest().key(function(d){return d[" platform"]; }).entries(data);
    //set the root of the tree hierarchy to point at the array of consoles
    var root = {values: nestObj};
    //create tree structure where the node values proportional to their number of children(console nodes)
    //or set it proportional to its critic score(game nodes)
    
//    var ConsoleHeirarchy = d3.hierarchy(root, function(d){return d.values; })
//        .sum(function(d){
//            if( typeof d.children !== 'undefined') return d.value;
//            return Math.pow((+d[" score"])/10, 2);
//        });
//    console.log(ConsoleHeirarchy);
    
    var val = [];
    nestObj.forEach(function(d, i){
        var obj = {
            platform: d.key,
            values: [
                {filter: "Allgames", values: d.values},
                {filter: "ByYear", values: YearsNest[i].values}
            ]
        };
        if(typeof d !== "undefined") val.push(obj);
    });
    
    var filterRoot = {values: val};
    //console.log(val);
    var filterHeirarchy = d3.hierarchy(filterRoot, function(d){return d.values; })
        .sum(function(d){
            //if( typeof d.children !== 'undefined') return 10;
            return Math.pow((+d[" score"])/10, 2);
        });
    //console.log(filterHeirarchy);
    ////////////////
    
    //use d3 pack on the tree and pack it into our svg canvas
    //pack will assign a radius based on the node value which we defined before
    var pack = d3.pack().size([width - 200, height]).padding(3);
    
    var packedConsoles = pack(filterHeirarchy);
    console.log(packedConsoles);
    console.log(packedConsoles.descendants());
    
    
    var AllNodes = packedConsoles.descendants();
    //console.log(AllNodes);
    var OnlyConsoles = AllNodes.filter(function(d){
        return d.depth <= 1;
    });
    
    var OnlyGames = AllNodes.filter(function(d){
        return d.height == 0;
    });
    //
    var GamesArr = d3.nest().key(function(d) {
        return d.data[" platform"]; 
    }).entries(OnlyGames);
    
    //console.log(GamesArr);
    //Only draw the consoles initially
    var leaf = svg.selectAll(".leaf")
        .data(OnlyConsoles)
        .enter().append("g")
        .attr("id", function(d){
            return "gcircle";
        })
        .attr("transform", function(d){
            return "translate("+(d.x)+","+(d.y)+")"
        });
    
    //draw console circles
    
    var circle = leaf.append("circle")
        .attr("id", function(d){
            return 'I'+d.depth;
        })
        .attr("r", function(d){return d.r;})
        
        .attr("fill", function(d){
            return d3.interpolateYlGn(d.depth/10);
        })
        .attr("visibility", function(d){
            //if(d.height == 0) return "hidden";
            return "visible";
        })
        .attr("pointer-events", function(d){
            if(d.depth != 1) return "none";
            //return "auto";
        })
        .style("cursor", "pointer");
    
    var leaflabels = leaf.append("text")
        .attr("id", "ogtext")
        .attr("opacity", 1)
        .style("font", "10px sans-serif")
        .attr("pointer-events", "none")
        .text(function(d){
            return d.data.platform;
        });
    //Function for drawing new circles when a console circle is selected
    let oldgroups = [];
    let oldcircles = [];
    let oldlabels = [];
    let newCount = 0;
    function label(d){
        if(d.depth == 2) return d.data.filter;
        else if(d.depth == 3) return d.data.key;
        else {
            //d3.selectAll("text").transition().duration(2000).attr("opacity", 0);
            return "";
        }
    }
    
    function update(x){
        //leaflabels.transition().duration(2000).attr("opacity", 0);
        //console node is passed
        //newleaf binds new data to leaf class
        //newleafGroups is an enter selection for new elements to be added
        var newleaf = svg.selectAll(".leaf").data(x);
        var newleafGroups = newleaf.enter().append("g")
            .attr("id", "gcircle")
            .attr("transform", function(d){
                if (v != null){
                    var tx = packedConsoles.x - v[0];
                    var ty = packedConsoles.y - v[1];
                    var ax = v[0] - (v[0] - d.x)*k;
                    var ay = v[1] - (v[1] - d.y)*k;
                    return "translate("+(ax + tx)+","+(ay + ty)+")";
                }
                else return "translate("+(d.x)+","+(d.y)+")";
        });
        //for every new element draw a new circle
        //leaflabels.transition().duration(2000).attr("opacity", 0.5);
        var newcircles = newleafGroups.append("circle")
        .attr("id", function(d){return "I"+d.depth; })
        .attr("r", 0)
        .attr("fill", function(d){
            return d3.interpolateYlGn(d.depth/10);
        })
        .style("cursor", "pointer")
        .on("click", function(d){
            Clicked(d);
        });
        outline(newcircles);
        var labels = newleafGroups.append("text")
            .attr("id", "newtext")
            .style("font", "10px sans-serif")
            .attr("opacity", 0)
            .attr("pointer-events", "none")
            .transition().duration(2000)
            .attr("opacity", 1)
            .text(function(d){ return label(d)});
        
        
        oldlabels.push(labels);
        oldgroups.push(newleafGroups);
    }
    
    function gameFilter(){
        svg.append("circle")
            .attr("cx", 100)
            .attr("cy", 200)
            .attr("r", 100)
            .attr("fill", "#45c");
    }
 
    
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
    .attr("x", width - 300)
    .attr("y", 90)
    .attr("width", 100)
    .attr("height", 100)
    .attr("xlink:href",src)
    .attr("visibility", "visible"); 

}    
    ////////// copied code //////////
    //also ugliest part of my code//
    //http://bl.ocks.org/nbremer/667e4df76848e72f250b
    //a good chunk of it was not altered but a good chunk was added/altered as well
    //zooms into selected circle
    //altered code so it zooms in differently
    //instead it centers the selected circle and enlarges it while
    //moving all other circles to a proportional distance to it so it gives the illusion that it zooms in on it
    //console.log(svg.node());
    function transformGroups(groups, tx, ty){
        groups.each(function(d, i){
            //console.log(i);
            var group = d3.select(this);
            
            if(d.height != 0){
                group.transition().duration(2000).attr("transform", function(d){
                var ax = v[0] - (v[0] - d.x)*k;
                var ay = v[1] - (v[1] - d.y)*k;
                return "translate("+(ax + tx)+","+(ay + ty)+")";
                }); 
            }
        });
    }
    
    function transformCircles(circles, tx, ty, node){
        circles.each(function(d, i){
            var circle = d3.select(this);
            
            if(d.height != 0){
                circle.transition().duration(2000).attr("r", function(d){return d.r * k;})
                    .on("end", showGames(node, oldgroups, tx, ty));
            }
        });
    }
    
    let focus = null;
    let fstack = [];
    let v = null;
    let vstack = [];
    let k = 1;
    let kstack = [];
    var delayScale = d3.scaleLinear();
    var log =d3.scalePow().exponent(3);//.domain([0, 6000]).range([0, 3000]);
    let len;
    function zoomToNode(node){
        v = [node.x, node.y, node.r * 3.05];
        k = width/v[2];
        var oldgroup = oldgroups[oldgroups.length-2];
        if(typeof oldgroup == "undefined") leaflabels.transition().duration(2000).attr("opacity", 0);
        else oldgroup.selectAll("text").transition().duration(2000).attr("opacity", 0);
        //d3.selectAll("text").transition().duration(2000).attr("opacity", 0);
        currDepth++;
        var tx = packedConsoles.x - node.x;//translation for selected circle to be centered
        var ty = packedConsoles.y - node.y;
        
        var circles = d3.selectAll("circle");
        var groups = d3.selectAll("#gcircle");
        
        len = node.children.length;
        
        delayScale.domain([0, len]).range([1000, 6000]);
        log.domain([0, len]).range([1000, 6000]);
        
        var nodeCount = 0;
        //if number of circles is too big, we will delay the transitions of each circle to reduce lag
        //i tried to mask the 'buffering' of the circles by making it look somewhat intentional/stylish
        groups.each(function(d){
            var group = d3.select(this);
            
            if(d.height == 0){
                var time;
                if(len > 1000) time = log(nodeCount);
                else time = 0;
                group.transition().delay(time).duration(2000).attr("transform",function(d){
                    var ax = v[0] - (v[0] - d.x)*k;
                    var ay = v[1] - (v[1] - d.y)*k;
                    return "translate("+(ax + tx)+","+(ay + ty)+")";
                });
                nodeCount++;
            }
            else group.transition().duration(2000).attr("transform", function(d){
                var ax = v[0] - (v[0] - d.x)*k;
                var ay = v[1] - (v[1] - d.y)*k;
                return "translate("+(ax + tx)+","+(ay + ty)+")";
            })
        });
        
// original group transition code 
//        groups.transition().duration(2000)
//            .attr("transform", function(d){
//                var ax = v[0] - (v[0] - d.x)*k;//Calculate circle position with respect to selected circle
//                var ay = v[1] - (v[1] - d.y)*k;
//                //since radius expands by k, distance from selected circle will be selected by k
//                return "translate("+(ax + tx)+","+(ay + ty)+")";
//            });
        
        nodeCount = 0;
        circles.each(function(d, i){
            var circle = d3.select(this);
            
            if(d.height == 0){
                var time;
                if(len > 1000) time = log(nodeCount);
                else time = 0;
                circle.transition().delay(time).duration(2000).attr("r", function(d){return d.r * k;})
                                .on("start", function(){circles.attr("pointer-events", "none")})
                                .on("end", function(){circles.attr("pointer-events", "auto")});
                nodeCount++;
            }
            else circle.transition().duration(2000).attr("r", function(d){return d.r * k;})
                            .on("start", function(){circles.attr("pointer-events", "none")})
                            .on("end", function(){circles.attr("pointer-events", "auto")});
        });
        zlen = len;
// original circle transition code
//        circles.transition().duration(2000)
//            .attr("r", function(d){return d.r * k; })
//            .on("start", function(){circles.attr("pointer-events", "none")})
//            .on("end", function(){circles.attr("pointer-events", "auto")});
    }
    
    var zdelay = 0;
    var zlen = 0;
    var dheight0 = false;
    function zoomOut(){ 
        currDepth--;
        
        var lastk = kstack.pop();
        k = lastk;
        var lastv = vstack.pop();
        var lastgroup = oldgroups.pop();
        v = lastv;
        
        
        var groups = d3.selectAll("#gcircle");
//        groups.transition().duration(2000)
//            .attr("transform", function(d){
//                if(lastv !== null){
//                    var tx = packedConsoles.x - lastv[0];
//                    var ty = packedConsoles.y - lastv[1];
//                    var ax = lastv[0] - (lastv[0] - d.x)*lastk;
//                    var ay = lastv[1] - (lastv[1] - d.y)*lastk;
//                    return "translate("+(ax + tx)+","+(ay + ty)+")";
//                }
//                else{
//                    //console.log("here");
//                    return "translate("+(d.x)+","+(d.y)+")";
//                }
//            }).on("end", function(){lastgroup.remove();});
        if(zlen > 1000) zdelay = 8000;
        else zdelay = 0;
        var nodeCount = 0;
        groups.each(function(d){
            var group = d3.select(this);
            
            if(d.height == 0){
                dheight0 = true;
                var time;
                if(zlen > 1000) time = log(nodeCount);
                else time = 0;
                group.transition().delay(time).duration(2000).attr("transform",function(d){
                    if(lastv !== null){
                        var tx = packedConsoles.x - lastv[0];
                        var ty = packedConsoles.y - lastv[1];
                        var ax = lastv[0] - (lastv[0] - d.x)*lastk;
                        var ay = lastv[1] - (lastv[1] - d.y)*lastk;
                        return "translate("+(ax + tx)+","+(ay + ty)+")";
                    }
                    else{
                    //console.log("here");
                        return "translate("+(d.x)+","+(d.y)+")";
                    }
                });
                nodeCount++;
            }
            else group.transition().delay(zdelay).duration(2000).attr("transform", function(d){
                if(lastv !== null){
                        var tx = packedConsoles.x - lastv[0];
                        var ty = packedConsoles.y - lastv[1];
                        var ax = lastv[0] - (lastv[0] - d.x)*lastk;
                        var ay = lastv[1] - (lastv[1] - d.y)*lastk;
                        return "translate("+(ax + tx)+","+(ay + ty)+")";
                    }
                    else{
                    //console.log("here");
                        return "translate("+(d.x)+","+(d.y)+")";
                    }
            }).on("end", function(){lastgroup.remove();});
        });
        
        //stinky label code
        var oldlabels = lastgroup.selectAll("text");
        oldlabels.transition().duration(2000).attr("opacity", 0);
        var labels = oldgroups[oldgroups.length-1];
        if(typeof labels == "undefined") leaflabels.transition().duration(2000).attr("opacity", 1);
        else labels.selectAll("text").transition().duration(2000).attr("opacity", 1);
        
        var circles = groups.selectAll("circle");
//        circles.transition().duration(2000)
//            .attr("r", function(d){
//                if(d.depth > currDepth) return 0;
//                else return d.r * lastk;
//        })
//        .on("start", function(){circles.attr("pointer-events", "none")})
//        .on("end", function(){circles.attr("pointer-events", "auto")});
        nodeCount = 0;
        circles.each(function(d, i){
            var circle = d3.select(this);

            if(d.height == 0){
                var time;
                if(zlen > 1000) time = log(nodeCount);
                else time = 0;
                circle.transition().delay(time).duration(2000).attr("r", function(d){
                    if(d.depth > currDepth) return 0;
                    else return d.r * lastk;
                })
                .on("start", function(){circles.attr("pointer-events", "none")})
                //.on("end", function(){circles.attr("pointer-events", "auto")});
                nodeCount++;
            }
            else circle.transition().delay(zdelay).duration(2000).attr("r", function(d){
                if(d.depth > currDepth) return 0;
                else return d.r * lastk;
            })
            .on("start", function(){circles.attr("pointer-events", "none")})
            .on("end", function(){circles.attr("pointer-events", "auto")});
        });   
        if(zdelay > 0){
            dheight0 = false;
            zlen = 0;
        }
    }
    //next step be able to click any level circle to zoom into. could just use a list
    let currDepth = 1;
    
    circle.on("click", function(d){
        Clicked(d);
    });
    
    outline(circle);
    
    function outline(circle){
        circle
        .on("mouseenter", function(d){

            var selection = d3.select(this);
            selection.attr("stroke", "#000")
                .attr("stroke-width", 2);
        })
        .on("mouseleave", function(d){
            var selection = d3.select(this);
            selection.attr("stroke", "none")
        });
    }
    
    function Clicked(d){
        if(d != focus && (d.height != 0)){
            update(d.children);
            
            kstack.push(k);
            fstack.push(focus);
            focus = d;
            vstack.push(v);
            
            zoomToNode(d);
            backbtn.raise();
            zoomOutBtn();
            
            console.log(svg.node());
        }
        else if(d == focus && (d.height != 0)){
            focus = fstack.pop();
            //btn.on("click", zoomOut)
            zoomOut();
            if(Game_Name_text.text() != "") resetGame();
            console.log(svg.node());
            
        }
        else{
            //zoomToNode(d);
            resetGame()
            newGame(d);
        }
    }
    

    function resetGame(){
        Game_Name_text.text("");
        Critic_Score_text.text("");
        d3.selectAll("image").remove();
    }
    function newGame(d){
        Game_Name_text.text("Name: "+d.data.name).raise();
        Critic_Score_text.text("Critic Score: "+d.data[" score"]).raise();
        Images.raise();
        appendImage(d.data);
    }
    
    var backbtn = svg.append("g")
        .attr("transform", "translate(100, 100)")
        //.attr("visibility", "hidden");
    
    var btn = backbtn.append("rect")
        .attr("width", 100)
        .attr("height", 50)
        .attr("opacity", 0)
        .attr("fill", d3.interpolateYlGn(0.4));
    
    var btntxt = backbtn.append("text")
        .attr("pointer-events", "none")
        .attr("opacity", 0)
        .attr("x", 20)
        .attr("y", 25)
        
        .text("Zoom Out");
    
    btn.on("click", function(){
                btn.style("stroke", "#000")
                    .style("stroke-width", 2);
                btn.transition().delay(2000).style("stroke", "none");
                    
        
                focus = fstack.pop();
                zoomOut();
                if(Game_Name_text.text() != "") resetGame();
                if(currDepth == 1){
                    btn.transition().duration(2000).attr("opacity", 0);
                    btntxt.transition().duration(2000).attr("opacity", 0);
                }
            });
    
    function zoomOutBtn(){
        if(btn.attr("opacity") == 0){
            btn.transition().style("stroke", "none");
            btn.transition().duration(2000).attr("opacity", 0.5);
            btntxt.transition().duration(2000).attr("opacity", 1);    
        }
    }
    //future ideas:
    //genre filter
    //pick any level circle to zoom out to, since right now i can only zoom out once.
    //more stylish stuff especially for presenting game info
    //setup remote sql database to read from
    //*for all games option, have the circles 'trickle' in since having them pop up all at once takes too long.
    //or for all games just wait till translation is over then increase radius size
});