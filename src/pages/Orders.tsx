import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus, Search, Receipt, Eye, X, Check, Trash2, Minus } from 'lucide-react';
import { Order, OrderItem } from '@/types';
import { toast } from 'sonner';

const Orders = () => {
  const { orders, customers, products, addOrder, updateOrder, deleteOrder, updateProduct } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const filteredOrders = orders.filter(
    (order) =>
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setSelectedCustomerId('');
    setOrderItems([]);
    setSelectedProductId('');
    setQuantity('1');
  };

  const handleAddItem = () => {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const qty = parseInt(quantity);
    if (qty <= 0) return;

    const existingItem = orderItems.find((i) => i.productId === product.id);
    if (existingItem) {
      setOrderItems(
        orderItems.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + qty, total: (i.quantity + qty) * i.unitPrice }
            : i
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          id: crypto.randomUUID(),
          productId: product.id,
          productName: product.name,
          quantity: qty,
          unitPrice: product.price,
          total: qty * product.price,
        },
      ]);
    }

    setSelectedProductId('');
    setQuantity('1');
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

  const handleCloseOrder = (order: Order) => {
    // Update product quantities
    order.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        updateProduct(product.id, {
          quantity: Math.max(0, product.quantity - item.quantity),
        });
      }
    });

    updateOrder(order.id, { status: 'closed', closedAt: new Date() });
    toast.success('Comanda fechada com sucesso!');
    setViewingOrder(null);
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm('Tem certeza que deseja cancelar esta comanda?')) {
      updateOrder(orderId, { status: 'cancelled' });
      toast.success('Comanda cancelada!');
      setViewingOrder(null);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Tem certeza que deseja excluir esta comanda?')) {
      deleteOrder(orderId);
      toast.success('Comanda excluída!');
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-primary/20 text-primary border-primary">Aberta</Badge>;
      case 'closed':
        return <Badge variant="secondary">Fechada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
    }
  };

  const orderTotal = orderItems.reduce((acc, i) => acc + i.total, 0);

  return (
    <MainLayout>
      <PageHeader title="Comandas" description="Gerencie as comandas dos clientes">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="bg-gradient-primary hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Nova Comanda
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-serif">Nova Comanda</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label>Cliente</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-border pt-4">
                <Label>Adicionar Produtos</Label>
                <div className="flex gap-2 mt-2">
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="flex-1 bg-input border-border">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - R$ {product.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-20 bg-input border-border"
                  />
                  <Button type="button" onClick={handleAddItem} variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {orderItems.length > 0 && (
                <div className="border rounded-lg border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id} className="border-border">
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">R$ {item.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                              className="h-8 w-8 text-destructive"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </TableCell>
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                  Criar Comanda
                </Button>
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
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{viewingOrder.customerName}</p>
                </div>

                <div className="border rounded-lg border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Unitário</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
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
                    <span className="font-semibold">Total da Comanda:</span>
                    <span className="text-2xl font-bold text-primary">
                      R$ {viewingOrder.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {viewingOrder.status === 'open' && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleCancelOrder(viewingOrder.id)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1 bg-success hover:bg-success/90"
                      onClick={() => handleCloseOrder(viewingOrder)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Fechar Comanda
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Search */}
      <Card className="mb-6 p-4 bg-card border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar comandas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-input border-border"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border/50 shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Comanda</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhuma comanda encontrada</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="border-border">
                  <TableCell className="font-mono text-sm">
                    #{order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="font-medium">{order.customerName}</TableCell>
                  <TableCell>{order.items.length} itens</TableCell>
                  <TableCell className="text-right font-semibold">
                    R$ {order.total.toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingOrder(order)}
                        className="hover:bg-muted"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="hover:bg-destructive/20 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </MainLayout>
  );
};

export default Orders;
