import { IExecuteFunctions } from 'n8n-core';

import { INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';

const pdf = require('pdf-parse');

export class ReadPDF implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Read PDF With Password',
		name: 'readPDFWithPassword',
		icon: 'fa:file-pdf',
		group: ['input'],
		version: 1,
		description: 'Reads a PDF and extracts its content',
		defaults: {
			name: 'Read PDF With Password',
			color: '#003355',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property from which to read the PDF file',
			},
			{
				displayName: 'Password',
				name: 'password',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'PDF Password',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		let item: INodeExecutionData;

		for (let itemIndex = 0; itemIndex < length; itemIndex++) {
			try {
				item = items[itemIndex];
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
				const password = this.getNodeParameter('password', itemIndex) as string;

				if (item.binary === undefined) {
					item.binary = {};
				}

				const binaryData = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
				returnData.push({
					binary: item.binary,
					json: await pdf({ data: binaryData, password: password }),
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
					continue;
				}
				throw error;
			}
		}
		return this.prepareOutputData(returnData);
	}
}
