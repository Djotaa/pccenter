$('document').ready(function(){
  var brendovi=[];
  var kategorije=[];
  //Dohvatanje navigacije i poziv funkcije za njen ispis
  ajaxCallback("nav.json","get",ispisNavigacije);
  //Ispis kategorija, brendova i proizvoda samo na stranici proizvodi gde postoji div za njihov ispis, ovim se sprečava greška u konzoli na ostalim stranicama
  if($("#categories").length){
    ajaxCallback("categories.json","get",function(result){
      ispisKat(result);
    });
  }
  //Ispis korpe samo ako na stranici postoji div za njen ispis, ovim se sprečava greška u konzoli na ostalim stranicama
  if($("#korpa").length){
    ajaxCallback("products.json","get",function(result){
      ispisKorpe(result);
    });
  }
  //Dodavanje dogadjaja elementima za filtriranje i sortiranje
  $("#sort").change(promena);
  $(document).on("change",".brand",promena);
  $(document).on("change",".category",promena);
  $('#search').keyup(promena);
  //Dodavanje dogadjaja za dodavanje u korpu
  $(document).on("click",".addToCart",addToCart);

  
});
//funkcija za AJAX
function ajaxCallback(file,method,result){
    $.ajax({
        url:"assets/data/"+file,
        method: method,
        dataType: "json",
        success: result,
        error: function(xhr){
            console.error(xhr.responseText);
        }
    })
}
//Funkcije za rad sa local storage-om
function setToLS(key,value){
  localStorage.setItem(key,value);
  refreshIcon();
}
function getFromLS(key){
  return localStorage.getItem(key);
}
function deleteFromLS(key){
  localStorage.removeItem(key);
  refreshIcon();
}
//Funkcija za ispis navigacije
function ispisNavigacije(nizNav){
    let html=`
    <a class="navbar-brand" href="index.html">PC Center</a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarTogglerDemo02" aria-controls="navbarTogglerDemo02" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    
    
    <div class="collapse navbar-collapse" id="navbarTogglerDemo02">
      <ul class="navbar-nav mr-auto mt-2 mt-lg-0" id="navigation">`;
    for(let navItem of nizNav){
        html+=`<li class="nav-item">
        <a class="nav-link" href="${navItem.href}">${navItem.text}</a>
      </li>`
    }
    html+=`</ul>
    <a href="korpa.html"class="btn btn-primary">Korpa<i class="fas fa-shopping-cart"></i> <span class="badge badge-light"></span></a>
    </div>
    </nav>`;
    $("#navigation").html(html);
    refreshIcon();
}
//Funkcija za ispis kategorija
function ispisKat(data){
  let html="";
  kategorije=data;
  for(let kat of data){
    html+=`<li class="list-group-item">
      <input type="checkbox" value="${kat.id}" class="category" name="categories"/> ${kat.name}
    </li>`
  }
  $("#categories").html(html);
  //Ajax poziv za brendove i njihov ispis
  ajaxCallback("brands.json","get",function(result){
    ispisBrend(result);
  })
}
//Funkcija za ispis brendova
function ispisBrend(data){
  let html="";
  brendovi=data;
  for(let brend of data){
    html+=`<li class="list-group-item">
      <input type="checkbox" value="${brend.id}" class="brand" name="brands"/> ${brend.name}
    </li>`
  }
  $("#brands").html(html);
  //Ajax poziv za proizvode i njihov ispis
  ajaxCallback("products.json","get",function(result){
    ispisProizvoda(result);
  })
}

//Funkcija za ispis proizvoda
function ispisProizvoda(proizvodi){
  let html="";
  proizvodi = brandFilter(proizvodi);
  proizvodi = sortiraj(proizvodi);
  proizvodi = catFilter(proizvodi);
  proizvodi = search(proizvodi);
  if(proizvodi.length>0){
    for(proizvod of proizvodi){
      html+=`<div class="col-12 col-sm-6 col-md-4 mt-2">
      <div class="card">
          <img src="assets/img/${proizvod.img.src}" class="card-img-top" alt="${proizvod.img.alt}">
          <div class="card-body">
            <h5 class="card-title">${proizvod.name}</h5><hr/>
            <p class="card-text m-0">Proizvodjac: ${getName(brendovi,proizvod.brand)}</p>
            <p class="card-text m-0">Kategorija: ${getName(kategorije,proizvod.category)}</p>`
            html+=getProps(proizvod.properties);
            html+=`<hr/><p class="card-text font-weight-bold m-0">Cena: ${proizvod.price},00 RSD</p>
            <a href="#!" class="btn btn-primary mt-2 addToCart" data-id=${proizvod.id}>Dodaj u korpu</a>
            <p class="text-success"></p>
          </div>
        </div>
      </div>`
    }
  }
  else{
    html=`<div class="container m-5 alert alert-danger"><p>Nema proizvoda koji odgovaraju vašoj pretrazi.</p></div>`
  }
  $("#products").html(html);
}
//Funkcija za dohvatanje svojstava svakog proizvoda
function getProps(props){
  let html="";
  for(let prop of props){
    html+=`<p class="card-text m-0">${prop}</p>`
  }
  return html;
}
//Funkcija za dohvatanje imena brenda ili imena proizvodjaca za proizvod
function getName(niz,id){
  return niz.filter(n=>n.id==id)[0].name;
}
//Funkcija za sortiranje po ceni
function sortiraj(proizvodi){
  let sortType = $("#sort").val();
  if(sortType=="asc"){
   return proizvodi.sort((a,b) => a.price > b.price ? 1 : -1);
  }
  else{
    return proizvodi.sort((a,b) => a.price < b.price ? 1 : -1);
  }
}
//Funkcija za filtriranje po brendu
function brandFilter(proizvodi){
  let izabraniBrendovi = [];
		$('.brand:checked').each(function(el){
			izabraniBrendovi.push(parseInt($(this).val()));
		});
		if(izabraniBrendovi.length != 0){
			return proizvodi.filter(x => izabraniBrendovi.includes(x.brand));	
		}
		return proizvodi;
}
//Funkcija za filtriranje po kategoriji
function catFilter(proizvodi){
  let izabraneKat = [];
  $('.category:checked').each(function(el){
    izabraneKat.push(parseInt($(this).val()));
  })
  if(izabraneKat.length!=0){
    return proizvodi.filter(p=>izabraneKat.includes(p.category));
  }
  return proizvodi;
}
//Funkcija za pretragu
function search(proizvodi){
  let searchVal=$("#search").val().toLowerCase();
  if(searchVal){
    return proizvodi.filter(p=>p.name.toLowerCase().indexOf(searchVal)!=-1);
  }
  return proizvodi;
}
//Funkcija koja poziva ispis proizvoda kada se izabere neka opcija za sort ili filter
function promena(){
  ajaxCallback("products.json","get",function(result){
    ispisProizvoda(result);    
  })
}
//Funkcija za dodavanje u korpu
function addToCart(){
  let id =$(this).data('id');
  let cartLS=getFromLS("cart");
  if(cartLS && cartLS.length){
    let cart = JSON.parse(cartLS);
    let indeks;
    let cartItem = cart.find((x,i)=>{
      if(x.id==id){
        indeks=i;
        return true;
      }
      return false;
    });
    if(cartItem){
      cart[indeks].quantity++;
    }
    else{
      cart.push({"id":id,"quantity":1});
    }
    cartLS=cart;
  }
  else{
   cartLS=[{"id":id,"quantity":1}];
  }
  setToLS("cart",JSON.stringify(cartLS));
  poruka($(this).next());
}
//Funkcija za ispis poruke da je proizvod dodat u korpu
function poruka(obj){
  obj.html(`<i class="fas fa-check"></i>Uspesno dodato`);
  setTimeout(function(){obj.html("");},3000);
  clearTimeout();
}
//Funkcija za ispis sadrzaja korpe
function ispisKorpe(proizvodi){
  let cartLS=getFromLS("cart");
  let html="";
  let cart = JSON.parse(cartLS);

  if(cart && cart.length>0){
    cart.forEach(x=>{
      let proizvod=proizvodi.find(p=>p.id==x.id);
      html+=`<div class="row mx-0 my-2 align-items-center border p-3">
      <div class="col-4 col-lg-2">
      <img class="img-fluid" src="assets/img/${proizvod.img.src}" alt="${proizvod.img.alt}"/>
      </div>
      <div class="col-8 col-lg-5">
      <h4>${proizvod.name}</h4>
      </div>
      <div class="col-6 col-lg-3 mt-3 mt-lg-0">
        <p>Količina</p>
        <input type="number" class="itemQuantity" data-id="${proizvod.id}" min="1" value="${x.quantity}"/>
        <span class="font-weight-bold">${proizvod.price*x.quantity} RSD</span>
      </div>
      <div class="col-6 col-lg-2 text-right">
        <a href="#!" class="btn btn-danger obrisi" data-id="${proizvod.id}">Ukloni</a> 
      </div>
      </div>`
    })

    $("#korpa").html(html);
    ukupnaCena(cart,proizvodi);
    //Funkcija koja menja ukupnu cenu i obracunatu cenu jednog proizvoda kada se promeni njegova kolicina u korpi
    $(".itemQuantity").change(function(){
    let vrednost=$(this).val();
    for(let i in cart){
      if(cart[i].id==$(this).data("id")){
        cart[i].quantity=vrednost;
        let proizvod=proizvodi.find(p=>p.id==cart[i].id);
        $(this).next().html(proizvod.price*cart[i].quantity + "RSD")
        ukupnaCena(cart,proizvodi);
        break;
      }
    }
    setToLS("cart",JSON.stringify(cart));
    })
    //Funkcija koja brise pojedinacne proizvode iz korpe
    $(".obrisi").click(function(){
      let id = $(this).data("id");
      for(let i in cart){
        if(cart[i].id==$(this).data("id")){
          cart.splice(i,1);
          break;
        }
      }
      setToLS("cart",JSON.stringify(cart));
      ispisKorpe(proizvodi);
    })

  }
  else{
    $("#korpa").html(`<div class="container m-5 alert alert-danger"><p>Nemate ništa u korpi. Pogledajte <a href="proizvodi.html">prodavnicu</a></p></div>`);
  }
}
//Funkcija koja racuna ukupnu cenu
function ukupnaCena(cart,proizvodi){
  let total=0;
  cart.forEach(x=>{
    let proizvod=proizvodi.find(p=>p.id==x.id);
    total+=proizvod.price*x.quantity;
  })
  $(".total").remove();
  $("#korpa").append(`<div class="total w-100 text-right pb-3"><p>Ukupna cena je <span class="font-weight-bold">${total}</span></p><a href="#!" id="obrisiSve" class="btn btn-danger">Ukloni sve</a> <a href="#!" id="order" class="btn btn-primary">Naručite</a></div>`);
  //Brisanje cele korpe
  $("#obrisiSve").click(function(){
    ukloniSve(ispisKorpe);
  });
  //Brisanje korpe i ispis poruke da je poruceno
  $("#order").click(function(){
    ukloniSve(order);
  })
}
function ukloniSve(callBack){
  deleteFromLS("cart");
  callBack();
}
function order(){
$("#korpa").html(`<div class="container m-5 alert alert-success"><p>Uspešno ste poručili. <a href="proizvodi.html">Nastavite sa kupovinom</a></p></div>`)
}
//Osvezavanje ikonice za korpu kada se doda novi proizvod ili obrise neki postojeci
function refreshIcon(){
  let ispis=getFromLS("cart") ? JSON.parse(getFromLS("cart")).length ? String(JSON.parse(getFromLS("cart")).length) : "" : "";
  $(".badge").text(ispis);
}
//Funkcije za obradu kontakt forme regularnim izrazima
function ukloniGreske(){
  $('.greska').hide();
  $('.uspeh').hide();
}
function greskaForme(elementForme,poruka){
  $(elementForme).next().text(poruka).fadeIn();
}
var izrazImePrezime = /^[A-ZŠĐČĆŽ][a-zšđčćž]{1,16}(\s[A-ZŠĐČĆŽ][a-zšđčćž]{2,16})*$/;
var izrazMejl = /^([a-z]{3,15})(([\.]?[-]?[_]?[a-z]{3,20})*([\d]{1,3})*)@([a-z]{3,20})(\.[a-z]{2,3})+$/;

$(document.conForm).on("submit",function(event){
  event.preventDefault();
  ukloniGreske();
  let forma=document.conForm;
  let greska=false;
  
  if(!izrazImePrezime.test(forma.imeFuter.value)){
      greskaForme(forma.imeFuter,"Ime i prezime moraju početi velikim slovom i imati po više od dva slova.")
      greska = true;
  }
  
  if(!izrazMejl.test(forma.mejlFuter.value)){
      greskaForme(forma.mejlFuter, "Unesite email u pravilnoj formi(primer: vaseime@gmail.com).")
      greska = true;
  }
  
  if(forma.poruka.value.length == "") {
      greskaForme(forma.poruka, "Molimo unesite poruku.");
      greska = true;
  }

  if(!greska){
      $('#btnSubmitFuter').next().text("Uspešno poslato!").fadeIn();
      forma.reset();
  }
})
