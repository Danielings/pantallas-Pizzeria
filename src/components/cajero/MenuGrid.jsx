import { useApp } from '../../context/AppContext';
import { Plus } from 'lucide-react';

export default function MenuGrid({ category }) {
  const { products, addToCart } = useApp();

  // Mapear categorías de filtro a productos reales
  let displayedProducts = [];

  const allPizzas = products.pizzas || [];
  const tradicionales = allPizzas.filter(p => p.price < 15);
  const gourmet = allPizzas.filter(p => p.price >= 15);

  switch (category) {
    case 'tradicionales':
      displayedProducts = tradicionales;
      break;
    case 'gourmet':
      displayedProducts = gourmet;
      break;
    case 'bebidas':
      displayedProducts = products.drinks || [];
      break;
    case 'combos':
      displayedProducts = products.combos || [];
      break;
    case 'all':
    default:
      displayedProducts = [
        ...allPizzas,
        ...(products.drinks || []),
        ...(products.combos || []),
        ...(products.icecream || [])
      ];
      break;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
        {displayedProducts.map(product => (
          <div 
            key={product.id} 
            className="bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-pizza hover:border-pizza-red/30 transition-all cursor-pointer group flex flex-col"
            onClick={() => addToCart(product, product.sizes?.[0])}
          >
            {product.image ? (
               <div className="h-32 w-full shrink-0 overflow-hidden bg-slate-50 relative">
                 <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                 <span className="absolute bottom-2 left-2 text-white font-bold">${product.price.toFixed(2)}</span>
               </div>
            ) : (
              <div className="h-24 w-full shrink-0 bg-slate-50 flex items-center justify-center text-4xl relative">
                {product.emoji}
                <span className="absolute bottom-2 right-2 text-slate-800 font-bold text-sm bg-white/80 px-2 rounded-full backdrop-blur-sm">
                  ${product.price.toFixed(2)}
                </span>
              </div>
            )}
            
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 line-clamp-1">{product.name}</h3>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">{product.description}</p>
              </div>
              
              <button className="mt-3 w-full shrink-0 py-1.5 flex items-center justify-center gap-1 bg-slate-50 hover:bg-pizza-red hover:text-white text-slate-600 rounded-lg text-xs font-semibold transition-colors">
                <Plus className="w-3 h-3" />
                Agregar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
