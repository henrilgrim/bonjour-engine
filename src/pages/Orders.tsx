import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Receipt, X, Check, Trash2, Minus, Clock } from 'lucide-react';
import { Order, OrderItem, PaymentMethod, formatDuration, paymentMethodLabels } from '@/types';
import { ProductSelector } from '@/components/orders/ProductSelector';
import { PaymentModal } from '@/components/orders/PaymentModal';
import { OrderCard } from '@/components/orders/OrderCard';
import { toast } from 'sonner';

const Orders = () => {
  const { orders, customers, products, categories, addOrder, updateOrder, deleteOrder, updateProduct, addCustomerCredit, updateCustomer } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [activeTab, setActiveTab] = useState('open');

  const openOrders = orders.filter(o => o.status === 'open');
  const closedOrders = orders.filter(o => o.status === 'closed' || o.status === 'cancelled');

  const filteredOrders = (activeTab === 'open' ? openOrders : closedOrders).filter(
    (order) =>
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setSelectedCustomerId('');
    setOrderItems([]);
  };

  const handleAddProduct = (product: typeof products[0], quantity: number) => {
    const existingItem = orderItems.find((i) => i.productId === product.id);
    if (existingItem) {
      setOrderItems(orderItems.map((i) =>
        i.productId === product.id
          ? { ...i, quantity: i.quantity + quantity, total: (i.quantity + quantity) * i.unitPrice }
          : i
      ));
    } else {
      setOrderItems([...orderItems, {
        id: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        total: quantity * product.price,
      }]);
    }
    toast.success(`${product.name} adicionado!`);
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter((i) => i.id !== itemId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer || orderItems.length === 0) {
      toast.error('Selecione um cliente e adicione pelo menos um item.');
      return;
    }
    const total = orderItems.reduce((acc, i) => acc + i.total, 0);
    addOrder({
      id: crypto.randomUUID(),
      customerId: customer.id,
      customerName: customer.name,
      items: orderItems,
      total,
      status: 'open',
      createdAt: new Date(),
    });
    toast.success('Comanda criada com sucesso!');
    setIsDialogOpen(false);
    resetForm();
  };

  const handleCloseOrder = (paymentMethod: PaymentMethod, paidAmount: number, creditUsed: number) => {
    if (!paymentOrder) return;
    
    paymentOrder.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        updateProduct(product.id, { quantity: Math.max(0, product.quantity - item.quantity) });
      }
    });

    if (creditUsed > 0) {
      addCustomerCredit(paymentOrder.customerId, creditUsed);
    }

    const customer = customers.find(c => c.id === paymentOrder.customerId);
    if (customer) {
      updateCustomer(customer.id, { totalPurchases: customer.totalPurchases + paymentOrder.total });
    }

    updateOrder(paymentOrder.id, { 
      status: 'closed', 
      closedAt: new Date(),
      paymentMethod,
      paidAmount,
      creditUsed,
    });
    
    toast.success('Comanda fechada com sucesso!');
    setPaymentOrder(null);
    setViewingOrder(null);
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm('Tem certeza que deseja cancelar esta comanda?')) {
      updateOrder(orderId, { status: 'cancelled', closedAt: new Date() });
      toast.success('Comanda cancelada!');
      setViewingOrder(null);
    }
  };

  const orderTotal = orderItems.reduce((acc, i) => acc + i.total, 0);
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'open': return <Badge className="bg-primary/20 text-primary border-primary">Aberta</Badge>;
      case 'closed': return <Badge variant="secondary">Fechada</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelada</Badge>;
    }
  };

  return (
    <MainLayout>
      <PageHeader title="Comandas" description="Gerencie as comandas dos clientes">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="bg-gradient-primary hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />Nova Comanda
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif">Nova Comanda</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label>Cliente</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="border-t border-border pt-4">
                <Label className="mb-3 block">Adicionar Produtos</Label>
                <ProductSelector products={products} categories={categories} onAddProduct={handleAddProduct} />
              </div>
              {orderItems.length > 0 && (
                <div className="border rounded-lg border-border overflow-hidden">
                  <Table>
                    <TableHeader><TableRow className="border-border"><TableHead>Produto</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Total</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id} className="border-border">
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">R$ {item.total.toFixed(2)}</TableCell>
                          <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="h-8 w-8 text-destructive"><Minus className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-3 bg-muted/50 flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold text-primary">R$ {orderTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-gradient-primary hover:opacity-90">Criar Comanda</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Order Details Dialog */}
      <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border">
          {viewingOrder && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="font-serif">Comanda #{viewingOrder.id.slice(0, 8)}</DialogTitle>
                  {getStatusBadge(viewingOrder.status)}
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-muted-foreground">Cliente</p><p className="font-medium">{viewingOrder.customerName}</p></div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" /><span className="text-sm">{formatDuration(viewingOrder.createdAt, viewingOrder.closedAt)}</span></div>
                  </div>
                </div>
                <div className="border rounded-lg border-border overflow-hidden">
                  <Table>
                    <TableHeader><TableRow className="border-border"><TableHead>Produto</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Unitário</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {viewingOrder.items.map((item) => (
                        <TableRow key={item.id} className="border-border">
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">R$ {item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">R$ {item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 bg-muted/50 flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-primary">R$ {viewingOrder.total.toFixed(2)}</span>
                  </div>
                </div>
                {viewingOrder.status === 'closed' && viewingOrder.paymentMethod && (
                  <div className="p-3 bg-muted/30 rounded-lg text-sm">
                    <p><span className="text-muted-foreground">Pagamento:</span> {paymentMethodLabels[viewingOrder.paymentMethod]}</p>
                    {viewingOrder.creditUsed && viewingOrder.creditUsed > 0 && <p><span className="text-muted-foreground">Fiado:</span> R$ {viewingOrder.creditUsed.toFixed(2)}</p>}
                  </div>
                )}
                {viewingOrder.status === 'open' && (
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => handleCancelOrder(viewingOrder.id)}><X className="mr-2 h-4 w-4" />Cancelar</Button>
                    <Button className="flex-1 bg-success hover:bg-success/90" onClick={() => setPaymentOrder(viewingOrder)}><Check className="mr-2 h-4 w-4" />Fechar Comanda</Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {paymentOrder && (
        <PaymentModal
          order={paymentOrder}
          customer={customers.find(c => c.id === paymentOrder.customerId)}
          open={!!paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onConfirm={handleCloseOrder}
        />
      )}

      {/* Search and Tabs */}
      <Card className="mb-6 p-4 bg-card border-border/50">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar comandas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-input border-border" />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="open">Abertas ({openOrders.length})</TabsTrigger>
              <TabsTrigger value="closed">Histórico</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <Card className="p-12 text-center bg-card border-border/50">
          <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhuma comanda encontrada</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} onView={() => setViewingOrder(order)} />
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default Orders;
