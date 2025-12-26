import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, StatCard } from '@/components/ui/page-header';
import { Package, Users, Receipt, TrendingUp, AlertTriangle, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const { products, customers, orders, suppliers, categories } = useStore();

  const totalProducts = products.length;
  const totalCustomers = customers.length;
  const openOrders = orders.filter(o => o.status === 'open').length;
  const lowStockProducts = products.filter(p => p.quantity <= p.minQuantity);
  const totalRevenue = orders
    .filter(o => o.status === 'closed')
    .reduce((acc, o) => acc + o.total, 0);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <MainLayout>
      <PageHeader
        title="Dashboard"
        description="Visão geral do seu negócio"
      />

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total de Produtos"
          value={totalProducts}
          icon={<Package className="h-6 w-6" />}
        />
        <StatCard
          title="Clientes Cadastrados"
          value={totalCustomers}
          icon={<Users className="h-6 w-6" />}
        />
        <StatCard
          title="Comandas Abertas"
          value={openOrders}
          icon={<Receipt className="h-6 w-6" />}
        />
        <StatCard
          title="Receita Total"
          value={`R$ ${totalRevenue.toFixed(2)}`}
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alert */}
        <Card className="bg-card border-border/50 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Estoque Baixo
            </CardTitle>
            <Badge variant="secondary">{lowStockProducts.length} items</Badge>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum produto com estoque baixo.</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Mínimo: {product.minQuantity}
                      </p>
                    </div>
                    <Badge variant="destructive">{product.quantity} unid.</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="bg-card border-border/50 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Comandas Recentes
            </CardTitle>
            <Badge variant="secondary">{orders.length} total</Badge>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma comanda registrada.</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{order.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} itens
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">R$ {order.total.toFixed(2)}</p>
                      <Badge
                        variant={order.status === 'open' ? 'default' : order.status === 'closed' ? 'secondary' : 'destructive'}
                      >
                        {order.status === 'open' ? 'Aberta' : order.status === 'closed' ? 'Fechada' : 'Cancelada'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="bg-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Fornecedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-foreground">{suppliers.length}</p>
              <p className="text-muted-foreground mt-1">Fornecedores cadastrados</p>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="bg-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  style={{ backgroundColor: category.color + '20', color: category.color, borderColor: category.color }}
                  className="border"
                >
                  {category.name}
                </Badge>
              ))}
              {categories.length === 0 && (
                <p className="text-muted-foreground text-sm">Nenhuma categoria cadastrada.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
