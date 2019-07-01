//const menuHeight = Array.from(document.querySelector('.actions').children).reduce((p, e) => p + e.offsetHeight, 0)

var manytabsbtninfo = [];
var manytabsbtnscrend = false;
function manytabsbtn_resize() {
  const divmenubtns = document.getElementsByClassName("action-group");
  const divmenubtnswidth = divmenubtns[0].offsetWidth;
  const logowidth = document.getElementsByClassName("logo-header")[0].offsetWidth;
  const divactions = document.getElementsByClassName("actions")[0];
  const divmanytabsbtnboxL = document.getElementById("manytabsbtnboxL");
  const divmanytabsbtnboxR = document.getElementById("manytabsbtnboxR");
  const divactiongroupbox = document.getElementsByClassName("actiongroupbox")[0];
  const divactiongroupboxleft = divactiongroupbox.offsetLeft - logowidth;
  if (document.body.clientWidth >= 750) {
    divmanytabsbtnboxL.style.display = "none";
    divmanytabsbtnboxR.style.display = "none";
    return;
  }
  divmanytabsbtnboxL.style.display = divactiongroupboxleft != 0 ? "block" : "none";
  let leftmin = 0;
  const divactionsscroll = divmenubtnswidth * divmenubtns.length;
  if (divactionsscroll > divactions.clientWidth) {
    divmanytabsbtnboxR.style.display = "block";
    leftmin = divactions.clientWidth - divactionsscroll;
    if (manytabsbtnscrend) {
      divactiongroupbox.style.left = leftmin + "px";
      divmanytabsbtnboxR.style.display = "none";
    } else {
      divactiongroupbox.style.left = 0;
    }
  } else {
    divmanytabsbtnboxR.style.display = "none";
  }
  manytabsbtninfo = [leftmin,divmenubtnswidth,divactiongroupboxleft,divactiongroupbox,divmanytabsbtnboxL,divmanytabsbtnboxR,logowidth,divactions];
}
window.addEventListener("resize", function () {
  manytabsbtn_resize();
}, false);
document.getElementById("manytabsbtnL").addEventListener("click", function(e){
  manytabsbtn_resize();
  manytabsbtnscrend = false;
  let newleft = manytabsbtninfo[2] + manytabsbtninfo[1];
  if (newleft >= 0) {
    newleft = 0;
    manytabsbtninfo[4].style.display = "none";
  } else {
    manytabsbtninfo[4].style.display = "block";
  }
  manytabsbtninfo[5].style.display = "block";
  manytabsbtninfo[3].style.left = newleft + "px";
});
document.getElementById("manytabsbtnR").addEventListener("click", function(e){
  manytabsbtn_resize();
  let newleft = manytabsbtninfo[2] - manytabsbtninfo[1];
  if (manytabsbtninfo[4].style.display = "none") newleft += 25;
  if (newleft <= manytabsbtninfo[0]) {
    newleft = manytabsbtninfo[0];
    manytabsbtninfo[5].style.display = "none";
    manytabsbtnscrend = true;
  } else {
    manytabsbtninfo[5].style.display = "block";
  }
  manytabsbtninfo[4].style.display = (newleft <= 0) ? "block" : "none";
  manytabsbtninfo[3].style.left = newleft + "px";
});
manytabsbtn_resize();