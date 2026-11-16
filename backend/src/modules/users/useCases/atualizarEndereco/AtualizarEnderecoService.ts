import type { UsersRepository } from "../../repositories/UsersRepository";

type EnderecoInput = {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    estado: string;
};

const ESTADOS_VALIDOS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS',
    'MT', 'PA', 'PB', 'PA', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS',
    'SC', 'SE', 'SP', 'TO',
];

export class AtualizarEnderecoService {
    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(userId: string, dados: Partial<EnderecoInput>) {
        const erros: Record<string, string> = {};

        // Se qualquer campo do endereço for preenchido, todos os obrigatórios são exigidos
        const camposObrigatorios: (keyof EnderecoInput)[] = [
            'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado',
        ];

        const algumPreenchido = camposObrigatorios.some(
            (campo) => dados[campo] && String(dados[campo]).trim().length > 0
        );

        if (!algumPreenchido) {
            // Nenhum campo preenchido: não faz nada (endereço opcional fora do checkout)
            return;
        }

        for (const campo of camposObrigatorios) {
            const valor = dados[campo];
            if (!valor || String(valor).trim().length === 0) {
                const nomes: Record<string, string> = {
                    cep: 'CEP',
                    logradouro: 'logradouro',
                    numero: 'número',
                    bairro: 'bairro',
                    cidade: 'cidade',
                    estado: 'estado',
                };
                erros[campo] = `Informe ${nomes[campo] === 'estado' ? 'o' : 'o'} ${nomes[campo]}.`;
                continue;
            }

            switch (campo) {
                case 'cep': {
                    const digitos = String(valor).replace(/\D/g, '');
                    if (digitos.length !== 8) {
                        erros.cep = 'Informe um CEP válido.';
                    }
                    break;
                }
                case 'cidade':
                    if (String(valor).length > 80) {
                        erros.cidade = 'Informe a cidade.';
                    }
                    break;
                case 'estado':
                    if (!ESTADOS_VALIDOS.includes(String(valor).toUpperCase())) {
                        erros.estado = 'Selecione o estado.';
                    }
                    break;
                case 'bairro':
                    if (String(valor).length > 80) {
                        erros.bairro = 'Informe o bairro.';
                    }
                    break;
                case 'logradouro':
                    if (String(valor).length > 120) {
                        erros.logradouro = 'Informe o logradouro.';
                    }
                    break;
                case 'numero':
                    if (String(valor).length > 10) {
                        erros.numero = 'Informe o número.';
                    }
                    break;
            }
        }

        if (Object.keys(erros).length > 0) {
            const erro: any = new Error('VALIDATION_ERROR');
            erro.erros = erros;
            throw erro;
        }

        const endereco: EnderecoInput = {
            cep: String(dados.cep).replace(/\D/g, ''),
            logradouro: String(dados.logradouro).trim(),
            numero: String(dados.numero).trim(),
            complemento: dados.complemento ? String(dados.complemento).trim() : null,
            bairro: String(dados.bairro).trim(),
            cidade: String(dados.cidade).trim(),
            estado: String(dados.estado).toUpperCase().trim(),
        };

        return this.usersRepository.upsertEndereco(userId, endereco);
    }
}
