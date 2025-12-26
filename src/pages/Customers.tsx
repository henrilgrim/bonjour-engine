import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Progress } from '@/components/ui/progress';
import { Plus, Search, Pencil, Trash2, Users, Mail, Phone, Eye, CreditCard, Wallet } from 'lucide-react';
import { Customer, CustomerRating, calculateCreditLimit, getAvailableCredit } from '@/types';
import { StarRating, getRatingLabel } from '@/components/ui/star-rating';
import { toast } from 'sonner';

const Customers = () => {
  const { customers, orders, addCustomer, updateCustomer, deleteCustomer, payCustomerCredit } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    address: '',
    notes: '',
    rating: 3 as CustomerRating,
  });

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.cpf.includes(searchTerm)
  );

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      cpf: '',
      address: '',
      notes: '',
      rating: 3,
    });
    setEditingCustomer(null);
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        cpf: customer.cpf,
        address: customer.address,
        notes: customer.notes,
        rating: customer.rating,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
      toast.success('Cliente atualizado com sucesso!');
    } else {
      addCustomer({
        ...formData,
        id: crypto.randomUUID(),
        totalPurchases: 0,
        totalPaid: 0,
        creditBalance: 0,
        createdAt: new Date(),
      });
      toast.success('Cliente cadastrado com sucesso!');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteCustomer(id);
      toast.success('Cliente excluído com sucesso!');
    }
  };

  const handlePayCredit = () => {
    if (!viewingCustomer || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > viewingCustomer.creditBalance) {
      toast.error('Valor inválido');
      return;
    }
    payCustomerCredit(viewingCustomer.id, amount);
    setPaymentAmount('');
    // Atualizar a visualização
    setViewingCustomer({
      ...viewingCustomer,
      creditBalance: Math.max(0, viewingCustomer.creditBalance - amount),
      totalPaid: viewingCustomer.totalPaid + amount,
    });
    toast.success(`Pagamento de R$ ${amount.toFixed(2)} registrado!`);
  };

  const getCustomerOrders = (customerId: string) => {
    return orders.filter((o) => o.customerId === customerId);
  };

  const getCustomerTotal = (customerId: string) => {
    return getCustomerOrders(customerId)
      .filter((o) => o.status === 'closed')
      .reduce((acc, o) => acc + o.total, 0);
  };

  return (
    <MainLayout>
      <PageHeader title="Clientes" description="Gerencie seus clientes">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-gradient-primary hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-serif">
                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-input border-border"
                />
              </div>
              
              <div>
                <Label>Classificação do Cliente</Label>
                <div className="flex items-center gap-3 mt-2">
                  <StarRating
                    rating={formData.rating}
                    onChange={(rating) => setFormData({ ...formData, rating })}
                    size="lg"
                  />
                  <span className="text-sm text-muted-foreground">
                    {getRatingLabel(formData.rating)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Limite de crédito base: R$ {(formData.rating * 50).toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                  {editingCustomer ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Customer Details Dialog */}
      <Dialog open={!!viewingCustomer} onOpenChange={() => setViewingCustomer(null)}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
          {viewingCustomer && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className="font-serif">{viewingCustomer.name}</DialogTitle>
                  <StarRating rating={viewingCustomer.rating} readonly size="sm" />
                </div>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{viewingCustomer.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{viewingCustomer.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-medium">{viewingCustomer.cpf || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-medium">{viewingCustomer.address || '-'}</p>
                  </div>
                </div>

                {/* Seção de Crédito */}
                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Linha de Crédito
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Limite Total</span>
                      <span className="font-medium">R$ {calculateCreditLimit(viewingCustomer).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Saldo Devedor</span>
                      <span className={`font-medium ${viewingCustomer.creditBalance > 0 ? 'text-destructive' : 'text-success'}`}>
                        R$ {viewingCustomer.creditBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Crédito Disponível</span>
                      <span className="font-medium text-primary">R$ {getAvailableCredit(viewingCustomer).toFixed(2)}</span>
                    </div>
                    <Progress 
                      value={(viewingCustomer.creditBalance / calculateCreditLimit(viewingCustomer)) * 100} 
                      className="h-2"
                    />
                    
                    {viewingCustomer.creditBalance > 0 && (
                      <div className="flex gap-2 mt-3">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={viewingCustomer.creditBalance}
                          placeholder="Valor do pagamento"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="bg-input border-border"
                        />
                        <Button 
                          onClick={handlePayCredit}
                          variant="secondary"
                          className="shrink-0"
                        >
                          <Wallet className="h-4 w-4 mr-2" />
                          Receber
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold mb-3">Resumo de Compras</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="p-3 bg-muted/50">
                      <p className="text-xs text-muted-foreground">Comandas</p>
                      <p className="text-xl font-bold">{getCustomerOrders(viewingCustomer.id).length}</p>
                    </Card>
                    <Card className="p-3 bg-muted/50">
                      <p className="text-xs text-muted-foreground">Total Gasto</p>
                      <p className="text-xl font-bold text-primary">
                        R$ {getCustomerTotal(viewingCustomer.id).toFixed(2)}
                      </p>
                    </Card>
                    <Card className="p-3 bg-muted/50">
                      <p className="text-xs text-muted-foreground">Total Pago</p>
                      <p className="text-xl font-bold text-success">
                        R$ {viewingCustomer.totalPaid.toFixed(2)}
                      </p>
                    </Card>
                  </div>
                </div>

                {viewingCustomer.notes && (
                  <div className="border-t border-border pt-4">
                    <h4 className="font-semibold mb-2">Observações</h4>
                    <p className="text-muted-foreground">{viewingCustomer.notes}</p>
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
            placeholder="Buscar clientes..."
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
              <TableHead>Cliente</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead className="text-right">Saldo Devedor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhum cliente encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="border-border">
                  <TableCell>
                    <p className="font-medium text-foreground">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.cpf || '-'}</p>
                  </TableCell>
                  <TableCell>
                    <StarRating rating={customer.rating} readonly size="sm" />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={customer.creditBalance > 0 ? 'destructive' : 'secondary'}>
                      R$ {customer.creditBalance.toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setViewingCustomer(customer);
                          setPaymentAmount('');
                        }}
                        className="hover:bg-muted"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(customer)}
                        className="hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(customer.id)}
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

export default Customers;
